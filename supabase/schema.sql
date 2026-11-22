-- ============================================================
--  NOIVERSO — database su Supabase
--  Incolla tutto questo file in: Supabase → SQL Editor → New query → Run.
--  Si può eseguire più volte senza problemi.
-- ============================================================

-- Salvataggi: un documento per giocatore e per profilo ("partita" = normale, "admin" = admin)
create table if not exists public.salvataggi (
  user_id    uuid not null references auth.users (id) on delete cascade,
  slot       text not null check (slot in ('partita', 'admin')),
  dati       jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now(),
  primary key (user_id, slot)
);

-- Classifica: una riga per giocatore, visibile a tutti
create table if not exists public.classifica (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  punti      integer not null default 0,
  dati       jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now()
);
create index if not exists classifica_punti on public.classifica (punti desc);

-- Configurazione condivisa (persone, serie e rarità delle carte decise dall'admin)
create table if not exists public.config (
  id         text primary key,
  dati       jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now()
);

-- Chi è admin (solo tu: ti aggiungi con il comando in fondo a questo file)
create table if not exists public.amministratori (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Nickname usati (per dire "nickname già preso" prima ancora di provare)
create table if not exists public.nickname (
  nick    text primary key,
  user_id uuid not null references auth.users (id) on delete cascade
);

create or replace function public.sono_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.amministratori where user_id = auth.uid());
$$;
grant execute on function public.sono_admin() to anon, authenticated;

create or replace function public.nickname_libero(n text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.nickname where nick = lower(n));
$$;
grant execute on function public.nickname_libero(text) to anon, authenticated;

-- ---------------- Accesso dalle app ----------------
-- Permessi espliciti, tabella per tabella (funziona anche se "Grant API access to new tables
-- automatically" non è spuntato). Cosa può fare davvero ognuno lo decidono le regole qui sotto.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.salvataggi to authenticated;
grant select, insert, update on public.classifica to authenticated;
grant select on public.config to anon, authenticated;
grant insert, update, delete on public.config to authenticated;
grant select on public.amministratori to authenticated;
grant insert on public.nickname to authenticated;

-- ---------------- Regole di sicurezza (RLS) ----------------
alter table public.salvataggi     enable row level security;
alter table public.classifica     enable row level security;
alter table public.config         enable row level security;
alter table public.amministratori enable row level security;
alter table public.nickname       enable row level security;

drop policy if exists "salvataggi: solo i propri" on public.salvataggi;
create policy "salvataggi: solo i propri" on public.salvataggi
  for all to authenticated
  using (user_id = auth.uid() and (slot = 'partita' or public.sono_admin()))
  with check (user_id = auth.uid() and (slot = 'partita' or public.sono_admin()));

drop policy if exists "classifica: tutti la leggono" on public.classifica;
create policy "classifica: tutti la leggono" on public.classifica
  for select to authenticated using (true);
drop policy if exists "classifica: ognuno scrive la sua riga" on public.classifica;
create policy "classifica: ognuno scrive la sua riga" on public.classifica
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "classifica: ognuno aggiorna la sua riga" on public.classifica;
create policy "classifica: ognuno aggiorna la sua riga" on public.classifica
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "config: tutti la leggono" on public.config;
create policy "config: tutti la leggono" on public.config
  for select to anon, authenticated using (true);
drop policy if exists "config: solo l'admin la cambia" on public.config;
create policy "config: solo l'admin la cambia" on public.config
  for all to authenticated using (public.sono_admin()) with check (public.sono_admin());

drop policy if exists "amministratori: ognuno vede se stesso" on public.amministratori;
create policy "amministratori: ognuno vede se stesso" on public.amministratori
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "nickname: ognuno registra il suo" on public.nickname;
create policy "nickname: ognuno registra il suo" on public.nickname
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------- Aggiornamenti in tempo reale ----------------
-- (classifica che si aggiorna da sola, progressi sincronizzati tra telefono e PC)
do $$ begin
  begin alter publication supabase_realtime add table public.salvataggi; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.classifica; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.config;     exception when duplicate_object then null; end;
end $$;

-- ---------------- Immagini delle carte: spazio privato ----------------
-- Le vede solo chi ha fatto l'accesso; le carica e le cambia solo l'admin.
insert into storage.buckets (id, name, public) values ('carte', 'carte', false)
  on conflict (id) do update set public = false;
drop policy if exists "carte: chi ha fatto l'accesso le vede" on storage.objects;
create policy "carte: chi ha fatto l'accesso le vede" on storage.objects
  for select to authenticated using (bucket_id = 'carte');
drop policy if exists "carte: solo l'admin le carica" on storage.objects;
create policy "carte: solo l'admin le carica" on storage.objects
  for insert to authenticated with check (bucket_id = 'carte' and public.sono_admin());
drop policy if exists "carte: solo l'admin le cambia" on storage.objects;
create policy "carte: solo l'admin le cambia" on storage.objects
  for update to authenticated using (bucket_id = 'carte' and public.sono_admin()) with check (bucket_id = 'carte' and public.sono_admin());
drop policy if exists "carte: solo l'admin le cancella" on storage.objects;
create policy "carte: solo l'admin le cancella" on storage.objects
  for delete to authenticated using (bucket_id = 'carte' and public.sono_admin());

-- ---------------- Sfide tra amici ----------------
-- Combatti contro la squadra vera di un amico (presa dal suo salvataggio, non da quello che manda il telefono).
-- Chi sfida e vince: +2 punti classifica; l'amico battuto: -1. Se chi sfida perde, l'amico che si è difeso: +1.
create table if not exists public.sfide_amici (
  id        bigint generated always as identity primary key,
  sfidante  uuid not null references auth.users (id) on delete cascade,
  sfidato   uuid not null references auth.users (id) on delete cascade,
  vinto     boolean not null,          -- ha vinto chi ha sfidato
  punti_sfidante integer not null,
  punti_sfidato  integer not null,
  visto     boolean not null default false,
  quando    timestamptz not null default now()
);
create index if not exists sfide_amici_sfidato on public.sfide_amici (sfidato, visto);
create index if not exists sfide_amici_sfidante on public.sfide_amici (sfidante, quando);
alter table public.sfide_amici enable row level security;
drop policy if exists "sfide: le mie" on public.sfide_amici;
create policy "sfide: le mie" on public.sfide_amici for select to authenticated
  using (sfidante = auth.uid() or sfidato = auth.uid());
grant select on public.sfide_amici to authenticated;
revoke all on public.sfide_amici from anon;

create or replace function public.punti_amici(u uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(punti_sfidante) from public.sfide_amici where sfidante = u), 0)
       + coalesce((select sum(punti_sfidato) from public.sfide_amici where sfidato = u), 0);
$$;

-- La squadra con cui l'amico si difende: quella attiva nel suo salvataggio, con i livelli veri
create or replace function public.squadra_amico(amico uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare d jsonb; att int;
begin
  if auth.uid() is null then raise exception 'Devi fare l''accesso'; end if;
  select dati into d from public.salvataggi where user_id = amico and slot = 'partita';
  if d is null then raise exception 'Questo giocatore non ha ancora un salvataggio'; end if;
  att := coalesce((d->>'attiva')::int, 0);
  return jsonb_build_object(
    'nome', coalesce(nullif(d->'profilo'->>'nome', ''), 'Giocatore'),
    'avatar', coalesce(d->'profilo'->>'avatar', ''),
    'squadra', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x,
        'liv', least(30, greatest(1, coalesce((d->'liv'->>x)::int, 1))),
        'lode', coalesce((d->'liv'->>x)::int, 1) >= 30 and coalesce((d->'lodeXp'->>x)::int, 0) >= 2000,
        'olo', coalesce((d->'olo'->>x)::boolean, false)) order by n)
      from jsonb_array_elements_text(coalesce(d->'squadre'->att->'carte', '[]'::jsonb)) with ordinality as t(x, n)), '[]'::jsonb));
end $$;

create or replace function public.registra_sfida(amico uuid, vinto boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); inizio timestamptz := date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome';
  coppia int; totale int;
begin
  if me is null then raise exception 'Devi fare l''accesso'; end if;
  if amico = me then raise exception 'Non puoi sfidare te stesso'; end if;
  if not exists (select 1 from public.salvataggi where user_id = amico and slot = 'partita') then raise exception 'Giocatore non trovato'; end if;
  select count(*) into coppia from public.sfide_amici where sfidante = me and sfidato = amico and quando >= inizio;
  select count(*) into totale from public.sfide_amici where sfidante = me and quando >= inizio;
  if coppia >= 3 then raise exception 'Oggi hai già sfidato questo amico 3 volte: riprova domani'; end if;
  if totale >= 12 then raise exception 'Per oggi hai fatto tutte le sfide tra amici (12): riprova domani'; end if;
  insert into public.sfide_amici (sfidante, sfidato, vinto, punti_sfidante, punti_sfidato)
    values (me, amico, vinto, case when vinto then 2 else 0 end, case when vinto then -1 else 1 end);
  -- ricalcola subito la classifica di tutti e due
  update public.classifica set aggiornato = now() where user_id in (me, amico);
  return jsonb_build_object('oggi_coppia', coppia + 1, 'oggi_totale', totale + 1);
end $$;

-- Le sfide che hai ricevuto e non hai ancora visto (per l'avviso "Marco ti ha battuto")
create or replace function public.segna_sfide_viste() returns void
language sql security definer set search_path = public as $$
  update public.sfide_amici set visto = true where sfidato = auth.uid() and not visto;
$$;
revoke all on function public.punti_amici(uuid), public.squadra_amico(uuid), public.registra_sfida(uuid, boolean), public.segna_sfide_viste() from public, anon;
grant execute on function public.punti_amici(uuid), public.squadra_amico(uuid), public.registra_sfida(uuid, boolean), public.segna_sfide_viste() to authenticated;

-- ---------------- Scambi di carte tra amici ----------------
-- Si scambiano solo doppioni: chi propone offre una carta di cui ha almeno 2 copie e chiede una carta che non ha,
-- di cui l'amico ha almeno 2 copie. Così nessuno perde mai una carta dall'album.
-- Il server controlla le copie vere nei salvataggi, contando anche gli scambi già in corso.
create table if not exists public.scambi (
  id       bigint generated always as identity primary key,
  da       uuid not null references auth.users (id) on delete cascade,
  a        uuid not null references auth.users (id) on delete cascade,
  offro    text not null,
  chiedo   text not null,
  stato    text not null default 'aperto' check (stato in ('aperto', 'accettato', 'rifiutato', 'annullato')),
  ritirato boolean not null default false,   -- chi ha proposto ha già ricevuto la carta
  creato   timestamptz not null default now(),
  chiuso   timestamptz
);
create index if not exists scambi_a on public.scambi (a, stato);
create index if not exists scambi_da on public.scambi (da, stato);
alter table public.scambi enable row level security;
drop policy if exists "scambi: i miei" on public.scambi;
create policy "scambi: i miei" on public.scambi for select to authenticated using (da = auth.uid() or a = auth.uid());
grant select on public.scambi to authenticated;
revoke all on public.scambi from anon;

-- copie che un giocatore può ancora dare: quelle nel salvataggio, meno quelle già promesse o già date ma non ancora ritirate
create or replace function public.copie_libere(u uuid, carta text, tranne bigint default null) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select (dati->'carte'->>carta)::int from public.salvataggi where user_id = u and slot = 'partita'), 0)
       - (select count(*) from public.scambi where da = u and offro = carta and (id <> coalesce(tranne, -1))
            and (stato = 'aperto' or (stato = 'accettato' and not ritirato)))::int;
$$;

create or replace function public.proponi_scambio(amico uuid, offro text, chiedo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nuovo bigint;
begin
  if me is null then raise exception 'Devi fare l''accesso'; end if;
  if amico = me then raise exception 'Non puoi scambiare con te stesso'; end if;
  if offro = chiedo then raise exception 'Scegli due carte diverse'; end if;
  if public.copie_libere(me, offro) < 2 then raise exception 'Puoi offrire solo carte di cui hai almeno 2 copie (non già promesse in altri scambi)'; end if;
  if coalesce((select (dati->'carte'->>chiedo)::int from public.salvataggi where user_id = me and slot = 'partita'), 0) > 0 then raise exception 'Questa carta ce l''hai già'; end if;
  if public.copie_libere(amico, chiedo) < 2 then raise exception 'Il tuo amico non ha un doppione di questa carta'; end if;
  if (select count(*) from public.scambi where da = me and stato = 'aperto') >= 5 then raise exception 'Hai già 5 proposte aperte: aspetta che ti rispondano o annullane una'; end if;
  if exists (select 1 from public.scambi s where s.da = me and s.a = amico and s.chiedo = proponi_scambio.chiedo and s.stato = 'aperto') then raise exception 'Hai già chiesto questa carta a questo amico'; end if;
  insert into public.scambi (da, a, offro, chiedo) values (me, amico, offro, chiedo) returning id into nuovo;
  return jsonb_build_object('id', nuovo);
end $$;

create or replace function public.rispondi_scambio(scambio bigint, accetto boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare x public.scambi;
begin
  select * into x from public.scambi where id = scambio for update;
  if x is null or x.a <> auth.uid() then raise exception 'Scambio non trovato'; end if;
  if x.stato <> 'aperto' then raise exception 'Questo scambio non è più aperto'; end if;
  if x.creato < now() - interval '7 days' then
    update public.scambi set stato = 'annullato', chiuso = now() where id = scambio;
    raise exception 'Questa proposta è scaduta (dura 7 giorni)';
  end if;
  if not accetto then
    update public.scambi set stato = 'rifiutato', chiuso = now() where id = scambio;
    return jsonb_build_object('stato', 'rifiutato');
  end if;
  if public.copie_libere(x.a, x.chiedo) < 2 then raise exception 'Non hai più un doppione di questa carta'; end if;
  if public.copie_libere(x.da, x.offro, x.id) < 2 then
    update public.scambi set stato = 'annullato', chiuso = now() where id = scambio;
    raise exception 'Il tuo amico non ha più il doppione che offriva: proposta annullata';
  end if;
  update public.scambi set stato = 'accettato', chiuso = now() where id = scambio;
  -- chi accetta riceve subito: il gioco toglie una copia di "chiedo" e aggiunge "offro"
  return jsonb_build_object('stato', 'accettato', 'dai', x.chiedo, 'ricevi', x.offro);
end $$;

create or replace function public.annulla_scambio(scambio bigint) returns void
language sql security definer set search_path = public as $$
  update public.scambi set stato = 'annullato', chiuso = now() where id = scambio and da = auth.uid() and stato = 'aperto';
$$;

-- Chi ha proposto ritira le carte degli scambi accettati (una volta sola per scambio)
create or replace function public.ritira_scambi() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  with presi as (
    update public.scambi set ritirato = true
    where da = auth.uid() and stato = 'accettato' and not ritirato
    returning id, offro, chiedo
  ) select coalesce(jsonb_agg(jsonb_build_object('id', id, 'dai', offro, 'ricevi', chiedo)), '[]'::jsonb) into r from presi;
  return r;
end $$;

-- I doppioni di un amico che si possono chiedere (solo gli id delle carte, niente altro del suo salvataggio)
create or replace function public.doppioni_amico(amico uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(k), '[]'::jsonb) from (
    select k from public.salvataggi s, jsonb_each_text(coalesce(s.dati->'carte', '{}'::jsonb)) as e(k, v)
    where s.user_id = amico and s.slot = 'partita' and auth.uid() is not null and v ~ '^[0-9]+$' and public.copie_libere(amico, k) >= 2
  ) t;
$$;
revoke all on function public.copie_libere(uuid, text, bigint), public.proponi_scambio(uuid, text, text), public.rispondi_scambio(bigint, boolean), public.annulla_scambio(bigint), public.ritira_scambi(), public.doppioni_amico(uuid) from public, anon;
grant execute on function public.proponi_scambio(uuid, text, text), public.rispondi_scambio(bigint, boolean), public.annulla_scambio(bigint), public.ritira_scambi(), public.doppioni_amico(uuid) to authenticated;

-- ---------------- Boss del gruppo ----------------
-- Ogni settimana (da lunedì a domenica) un boss con tanti PV che tutti colpiscono insieme.
-- 3 attacchi al giorno a testa, al massimo 6000 danni per attacco. Se cade, premio per chi ha partecipato.
create table if not exists public.boss_settimana (
  settimana text primary key,
  pv_max    integer not null,
  creato    timestamptz not null default now()
);
create table if not exists public.boss_danni (
  settimana  text not null references public.boss_settimana (settimana) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  danni      integer not null default 0,
  colpi      integer not null default 0,
  giorno     date,
  colpi_oggi integer not null default 0,
  riscosso   boolean not null default false,
  primary key (settimana, user_id)
);
alter table public.boss_settimana enable row level security;
alter table public.boss_danni enable row level security;
drop policy if exists "boss: tutti lo vedono" on public.boss_settimana;
create policy "boss: tutti lo vedono" on public.boss_settimana for select to authenticated using (true);
drop policy if exists "danni boss: tutti li vedono" on public.boss_danni;
create policy "danni boss: tutti li vedono" on public.boss_danni for select to authenticated using (true);
grant select on public.boss_settimana, public.boss_danni to authenticated;
revoke all on public.boss_settimana, public.boss_danni from anon;

create or replace function public.settimana_attuale() returns text
language sql stable as $$ select to_char(now() at time zone 'Europe/Rome', 'IYYY-"W"IW') $$;

create or replace function public.boss_attuale() returns jsonb
language plpgsql security definer set search_path = public as $$
declare s text := public.settimana_attuale(); oggi date := (now() at time zone 'Europe/Rome')::date; b public.boss_settimana; tot int;
begin
  if auth.uid() is null then raise exception 'Devi fare l''accesso'; end if;
  -- i PV crescono con quanti giocano: 10.000 per ogni giocatore attivo nelle ultime 2 settimane (almeno 30.000)
  insert into public.boss_settimana (settimana, pv_max)
    values (s, greatest(30000, 10000 * (select count(*) from public.salvataggi where slot = 'partita' and aggiornato > now() - interval '14 days')))
    on conflict (settimana) do nothing;
  select * into b from public.boss_settimana where settimana = s;
  select coalesce(sum(danni), 0) into tot from public.boss_danni where settimana = s;
  return jsonb_build_object(
    'settimana', s, 'pv_max', b.pv_max, 'danni', tot,
    'fine', ((date_trunc('week', now() at time zone 'Europe/Rome') + interval '7 days') at time zone 'Europe/Rome'),
    'colpi_oggi', coalesce((select case when giorno = oggi then colpi_oggi else 0 end from public.boss_danni where settimana = s and user_id = auth.uid()), 0),
    'classifica', coalesce((select jsonb_agg(jsonb_build_object('id', d.user_id, 'danni', d.danni, 'nome', coalesce(c.dati->>'nome', 'Giocatore'), 'avatar', coalesce(c.dati->>'avatar', '')) order by d.danni desc)
       from public.boss_danni d left join public.classifica c on c.user_id = d.user_id where d.settimana = s and d.danni > 0), '[]'::jsonb),
    -- premi da riscuotere: boss sconfitti (anche delle settimane passate) a cui hai partecipato
    'da_riscuotere', coalesce((select jsonb_agg(x.settimana) from public.boss_danni x join public.boss_settimana y using (settimana)
       where x.user_id = auth.uid() and x.danni > 0 and not x.riscosso
         and (select sum(z.danni) from public.boss_danni z where z.settimana = x.settimana) >= y.pv_max), '[]'::jsonb));
end $$;

create or replace function public.colpisci_boss(danni integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s text := public.settimana_attuale(); oggi date := (now() at time zone 'Europe/Rome')::date; r public.boss_danni; pv int; tot int; d int := least(greatest(coalesce(danni, 0), 0), 6000);
begin
  if auth.uid() is null then raise exception 'Devi fare l''accesso'; end if;
  perform public.boss_attuale();
  select pv_max into pv from public.boss_settimana where settimana = s;
  select coalesce(sum(x.danni), 0) into tot from public.boss_danni x where x.settimana = s;
  if tot >= pv then raise exception 'Il boss di questa settimana è già stato sconfitto'; end if;
  insert into public.boss_danni (settimana, user_id) values (s, auth.uid()) on conflict do nothing;
  select * into r from public.boss_danni where settimana = s and user_id = auth.uid() for update;
  if r.giorno = oggi and r.colpi_oggi >= 3 then raise exception 'Oggi hai già attaccato il boss 3 volte: torna domani'; end if;
  update public.boss_danni set danni = r.danni + d, colpi = r.colpi + 1,
    colpi_oggi = case when r.giorno = oggi then r.colpi_oggi + 1 else 1 end, giorno = oggi
    where settimana = s and user_id = auth.uid();
  return public.boss_attuale() || jsonb_build_object('registrati', d, 'sconfitto_ora', tot < pv and tot + d >= pv);
end $$;

create or replace function public.riscatta_boss(sett text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.boss_danni; pv int; tot int; pos int; n int;
begin
  select * into r from public.boss_danni where settimana = sett and user_id = auth.uid() for update;
  select pv_max into pv from public.boss_settimana where settimana = sett;
  select coalesce(sum(danni), 0), count(*) filter (where danni > 0) into tot, n from public.boss_danni where settimana = sett;
  if r is null or r.danni <= 0 or tot < pv then raise exception 'Non c''è nessun premio da riscuotere'; end if;
  if r.riscosso then raise exception 'Premio già riscosso'; end if;
  update public.boss_danni set riscosso = true where settimana = sett and user_id = auth.uid();
  select count(*) + 1 into pos from public.boss_danni where settimana = sett and danni > r.danni;
  return jsonb_build_object('settimana', sett, 'posizione', pos, 'partecipanti', n, 'danni', r.danni);
end $$;
revoke all on function public.boss_attuale(), public.colpisci_boss(integer), public.riscatta_boss(text) from public, anon;
grant execute on function public.boss_attuale(), public.colpisci_boss(integer), public.riscatta_boss(text) to authenticated;

-- ---------------- Controlli contro i trucchi ----------------
-- Il gioco gira sul dispositivo di ognuno, quindi il server controlla i salvataggi:
-- rifiuta valori impossibili da ottenere giocando e tiene la classifica allineata al salvataggio vero.
create or replace function public.controlla_salvataggio() returns trigger
language plpgsql security definer set search_path = public as $$
declare d jsonb := new.dati; vecchio jsonb; inv jsonb;
begin
  -- l'editor SQL di Supabase (cioè tu) e l'admin non vengono controllati
  if auth.uid() is null or new.slot = 'admin' or public.sono_admin() then return new; end if;
  if coalesce((d->>'admin')::boolean, false) or coalesce((d->>'adminPronto')::boolean, false) then
    raise exception 'Salvataggio non valido (admin)';
  end if;
  if coalesce((d->>'monete')::numeric, 0) > 1000000 or coalesce((d->>'monete')::numeric, 0) < 0 then
    raise exception 'Salvataggio non valido (monete)';
  end if;
  inv := coalesce(d->'inventario', '{}'::jsonb);
  if coalesce((inv->>'leggendaria')::int, 0) > 100
     or exists (select 1 from jsonb_each_text(inv) where value ~ '^-?[0-9.]+$' and (value::numeric > 300 or value::numeric < 0)) then
    raise exception 'Salvataggio non valido (bustine)';
  end if;
  if exists (select 1 from jsonb_each_text(coalesce(d->'liv', '{}'::jsonb)) where value::numeric > 30) then
    raise exception 'Salvataggio non valido (livelli)';
  end if;
  -- monete, vittorie e punti non possono saltare di colpo tra un salvataggio e l'altro
  select dati into vecchio from public.salvataggi where user_id = new.user_id and slot = new.slot;
  if vecchio is not null then
    if coalesce((d->>'monete')::numeric, 0) - coalesce((vecchio->>'monete')::numeric, 0) > 50000 then
      raise exception 'Salvataggio non valido (troppe monete in una volta)';
    end if;
    if coalesce((d->'stats'->>'vittorie')::int, 0) - coalesce((vecchio->'stats'->>'vittorie')::int, 0) > 20
       or coalesce((d->'stats'->>'punti')::int, 0) - coalesce((vecchio->'stats'->>'punti')::int, 0) > 200 then
      raise exception 'Salvataggio non valido (troppe vittorie in una volta)';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists controlla_salvataggio on public.salvataggi;
create trigger controlla_salvataggio before insert or update on public.salvataggi
  for each row execute function public.controlla_salvataggio();

create or replace function public.classifica_vera() returns trigger
language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  -- i numeri in classifica arrivano dal salvataggio, non da quello che manda il dispositivo
  select dati into s from public.salvataggi where user_id = new.user_id and slot = 'partita';
  new.punti := greatest(0, coalesce((s->'stats'->>'punti')::int, 0) + public.punti_amici(new.user_id));
  new.dati := coalesce(new.dati, '{}'::jsonb) || jsonb_build_object(
    'punti', new.punti,
    'vittorie', coalesce((s->'stats'->>'vittorie')::int, 0),
    'sconfitte', coalesce((s->'stats'->>'sconfitte')::int, 0),
    'carte', (select count(*) from jsonb_object_keys(coalesce(s->'carte', '{}'::jsonb))),
    'vinte_amici', (select count(*) from public.sfide_amici where (sfidante = new.user_id and vinto) or (sfidato = new.user_id and not vinto)));
  new.aggiornato := now();
  return new;
end $$;
drop trigger if exists classifica_vera on public.classifica;
create trigger classifica_vera before insert or update on public.classifica
  for each row execute function public.classifica_vera();

-- ---------------- Codici promozionali ----------------
-- I codici (e le sorprese che nascondono) stanno solo qui: il codice del gioco su GitHub non li contiene.
-- Nessun giocatore può leggere la tabella: un codice si può solo "provare" con riscatta_codice().
create table if not exists public.codici (
  codice  text primary key check (codice = upper(codice) and codice !~ '\s'),
  premio  jsonb not null default '{}'::jsonb,
  attivo  boolean not null default true,
  usi_max integer,                        -- quante persone diverse possono usarlo (vuoto = senza limite)
  creato  timestamptz not null default now()
);
create table if not exists public.codici_usati (
  user_id uuid not null references auth.users (id) on delete cascade,
  codice  text not null references public.codici (codice) on delete cascade on update cascade,
  quando  timestamptz not null default now(),
  primary key (user_id, codice)
);
alter table public.codici enable row level security;
alter table public.codici_usati enable row level security;
drop policy if exists "codici: solo l'admin" on public.codici;
create policy "codici: solo l'admin" on public.codici for all to authenticated
  using (public.sono_admin()) with check (public.sono_admin());
drop policy if exists "codici usati: i miei, o tutti per l'admin" on public.codici_usati;
create policy "codici usati: i miei, o tutti per l'admin" on public.codici_usati for select to authenticated
  using (user_id = auth.uid() or public.sono_admin());
grant select, insert, update, delete on public.codici to authenticated;
grant select on public.codici_usati to authenticated;
revoke all on public.codici, public.codici_usati from anon;

create or replace function public.riscatta_codice(c text, prova boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k public.codici; gia boolean;
begin
  if auth.uid() is null then raise exception 'Devi fare l''accesso per usare un codice'; end if;
  select * into k from public.codici where codice = upper(regexp_replace(coalesce(c, ''), '\s', '', 'g'));
  if not found or not k.attivo then raise exception 'Codice non valido'; end if;
  -- l'admin può provare un codice senza consumarlo
  if prova and public.sono_admin() then return k.premio || jsonb_build_object('codice', k.codice, 'prova', true); end if;
  gia := exists (select 1 from public.codici_usati where user_id = auth.uid() and codice = k.codice);
  if gia then
    if coalesce((k.premio->>'ripetibile')::boolean, false) then
      return (k.premio - 'monete' - 'bustine') || jsonb_build_object('codice', k.codice, 'gia', true);
    end if;
    raise exception 'Hai già usato questo codice';
  end if;
  if k.usi_max is not null and (select count(*) from public.codici_usati where codice = k.codice) >= k.usi_max then
    raise exception 'Codice esaurito: l''hanno già usato tutti quelli che potevano';
  end if;
  insert into public.codici_usati (user_id, codice) values (auth.uid(), k.codice);
  return k.premio || jsonb_build_object('codice', k.codice);
end $$;
revoke all on function public.riscatta_codice(text, boolean) from public, anon;
grant execute on function public.riscatta_codice(text, boolean) to authenticated;

-- Fine. Dopo esserti registrato nel gioco, esegui supabase/importa-progressi.sql
-- (porta i tuoi progressi e ti rende admin).
