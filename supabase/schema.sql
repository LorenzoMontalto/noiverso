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

-- ---------------- Sfide dal vivo ----------------
-- I due telefoni giocano la stessa battaglia e alla fine ognuno dice chi ha vinto.
-- Se dicono la stessa cosa la partita vale +3 al vincitore (chi perde prende 0). È l'unico modo di fare punti in classifica.
-- Chi ammette di aver perso conferma subito; chi dice di aver vinto aspetta che l'altro confermi.
-- Se l'altro è sparito (abbandono) vale +3 anche quella, ma una sola volta al giorno per coppia di amici
-- (un abbandono non si può verificare, così nessuno si inventa vittorie). Se non sono d'accordo: niente punti.
create table if not exists public.partite_vivo (
  id         uuid primary key,
  a          uuid not null references auth.users (id) on delete cascade,   -- chi ha sfidato
  b          uuid not null references auth.users (id) on delete cascade,   -- chi ha accettato
  vince_a    uuid, vince_b uuid,          -- chi ha vinto secondo a e secondo b
  detto_a    boolean not null default false, detto_b boolean not null default false,
  motivo_a   text, motivo_b text,
  vincitore  uuid,
  punti      integer not null default 0,
  stato      text not null default 'attesa' check (stato in ('attesa', 'ok', 'abbandono', 'contestata')),
  creata     timestamptz not null default now()
);
create index if not exists partite_vivo_a on public.partite_vivo (a, creata);
create index if not exists partite_vivo_b on public.partite_vivo (b, creata);
create index if not exists partite_vivo_vincitore on public.partite_vivo (vincitore) where stato in ('ok', 'abbandono');
alter table public.partite_vivo enable row level security;
drop policy if exists "partite vivo: le mie" on public.partite_vivo;
create policy "partite vivo: le mie" on public.partite_vivo for select to authenticated using (a = auth.uid() or b = auth.uid());
grant select on public.partite_vivo to authenticated;
revoke all on public.partite_vivo from anon;

create or replace function public.punti_amici(u uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(punti_sfidante) from public.sfide_amici where sfidante = u), 0)
       + coalesce((select sum(punti_sfidato) from public.sfide_amici where sfidato = u), 0)
       + coalesce((select sum(punti) from public.partite_vivo where vincitore = u and stato in ('ok', 'abbandono')), 0);
$$;

create or replace function public.chiudi_partita_vivo(partita uuid, avversario uuid, sono_a boolean, chi_vince uuid, firma text, motivo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.partite_vivo; v uuid; st text := 'attesa'; pt int := 0; n int;
  inizio timestamptz := date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome';
begin
  if me is null then raise exception 'Devi fare l''accesso'; end if;
  if avversario is null or avversario = me then raise exception 'Avversario non valido'; end if;
  if chi_vince is not null and chi_vince <> me and chi_vince <> avversario then raise exception 'Vincitore non valido'; end if;
  if not exists (select 1 from public.salvataggi where user_id = avversario and slot = 'partita') then raise exception 'Giocatore non trovato'; end if;
  motivo := left(coalesce(motivo, ''), 20);
  insert into public.partite_vivo (id, a, b) values (partita, case when sono_a then me else avversario end, case when sono_a then avversario else me end)
    on conflict (id) do nothing;
  select * into p from public.partite_vivo where id = partita for update;
  if not ((sono_a and p.a = me and p.b = avversario) or (not sono_a and p.b = me and p.a = avversario)) then raise exception 'Partita non tua'; end if;
  if p.creata < now() - interval '3 hours' then raise exception 'Partita troppo vecchia'; end if;
  -- ognuno lo dice una volta sola
  if (sono_a and p.detto_a) or (not sono_a and p.detto_b) then return jsonb_build_object('stato', p.stato, 'punti', p.punti); end if;
  if sono_a then update public.partite_vivo set detto_a = true, vince_a = chi_vince, motivo_a = motivo where id = partita returning * into p;
  else update public.partite_vivo set detto_b = true, vince_b = chi_vince, motivo_b = motivo where id = partita returning * into p; end if;

  if coalesce(p.motivo_a, '') = 'contestata' or coalesce(p.motivo_b, '') = 'contestata' then st := 'contestata';
  elsif p.detto_a and p.detto_b then
    if p.vince_a is not null and p.vince_a = p.vince_b then st := 'ok'; v := p.vince_a; else st := 'contestata'; end if;
  else
    -- ha parlato uno solo
    v := coalesce(p.vince_a, p.vince_b);
    if v is null then st := 'contestata';
    elsif v = avversario then st := 'ok';                                  -- ammette di aver perso: vale subito
    elsif motivo = 'abbandono' then st := 'abbandono';                     -- l'altro è sparito
    else st := 'attesa'; v := null; end if;
  end if;

  if st = 'ok' then
    pt := 3;
  elsif st = 'abbandono' then
    select count(*) into n from public.partite_vivo where id <> partita and stato = 'abbandono' and creata >= inizio
      and ((a = p.a and b = p.b) or (a = p.b and b = p.a));
    pt := case when n < 1 then 3 else 0 end;
  end if;
  update public.partite_vivo set stato = st, vincitore = case when st in ('ok', 'abbandono') then v end, punti = pt where id = partita;
  -- se i due avevano una partita del torneo da giocare, questa vale per il torneo
  if st in ('ok', 'abbandono') and v is not null then perform public.torneo_esito(p.a, p.b, v); end if;
  -- la classifica si ricalcola subito per i due giocatori
  update public.classifica set aggiornato = now() where user_id in (p.a, p.b);
  return jsonb_build_object('stato', st, 'punti', pt);
end $$;
revoke all on function public.chiudi_partita_vivo(uuid, uuid, boolean, uuid, text, text) from public, anon;
grant execute on function public.chiudi_partita_vivo(uuid, uuid, boolean, uuid, text, text) to authenticated;

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
    'avatar', case when coalesce((d->'carte'->>(d->'profilo'->>'avatar'))::int, 0) > 0 then d->'profilo'->>'avatar' else '' end,
    -- il graffito della squadra che l'amico ha in campo, con il livello vero (copie, massimo 5)
    'graffito', (select case when coalesce(g, '') <> '' and coalesce((d->'graffiti'->>g)::int, 0) > 0
        then jsonb_build_object('id', g, 'liv', least(5, (d->'graffiti'->>g)::int)) end
      from (select coalesce(d->'squadre'->att->>'graffito', d->>'graffito') as g) x),
    'squadra', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x,
        'liv', least(30, greatest(1, coalesce((d->'liv'->>x)::int, 1))),
        'lode', coalesce((d->'liv'->>x)::int, 1) >= 30 and coalesce((d->'lodeXp'->>x)::int, 0) >= 2000,
        'olo', coalesce((d->'olo'->>x)::boolean, false),
        'ultra', coalesce((d->'ultra'->>x)::boolean, false),
        -- Ascesa: quante volte la carta è salita di rarità (0-3)
        'asc', least(3, greatest(0, case when d->'asc'->>x ~ '^[0-9]+$' then (d->'asc'->>x)::int else 0 end)),
        -- nov 2026: stelle della maestria (si vedono sulla carta in battaglia, non cambiano la forza)
        'stelle', least(5, case when jsonb_typeof(d->'maestria'->x->'presi') = 'array' then jsonb_array_length(d->'maestria'->x->'presi') else 0 end)) order by n)
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

alter table public.scambi add column if not exists ritirato_il timestamptz;

-- ---------------- Scambi con i potenziatori ----------------
-- Un doppione, quando lo trovi, diventa potenziatori di quella carta (10 comune, 12 rara, 24 epica, 60 leggendaria).
-- Per scambiare una carta paghi proprio quei potenziatori: è come dare via un doppione. La carta resta nel tuo album.
-- Si scambia solo tra carte della stessa rarità, e si riceve solo una carta che non si ha.
-- INIZIO RARITA (scritto da costruisci.py a partire da sorgente/carte.js: non modificarlo a mano)
create or replace function public.rarita_base(carta text) returns text language sql immutable as $$
  select case carta
    when 'loca' then 'leggendaria'
    when 'fuego' then 'rara'
    when 'reina' then 'leggendaria'
    when 'chapo' then 'rara'
    when 'rojo' then 'comune'
    when 'ombra' then 'leggendaria'
    when 'pelado' then 'comune'
    when 'fiesta' then 'comune'
    when 'diablo' then 'epica'
    when 'bandita' then 'epica'
    when 'gossip' then 'epica'
    when 'comora' then 'rara'
    when 'vedovagreca' then 'comune'
    when 'spidertoto' then 'epica'
    when 'wonderrita' then 'rara'
    when 'stellascura' then 'comune'
    when 'mieloki' then 'epica'
    when 'ironlus' then 'leggendaria'
    when 'cypips' then 'comune'
    when 'mauthor' then 'leggendaria'
    when 'undercut' then 'rara'
    when 'ligulk' then 'leggendaria'
    when 'wandessia' then 'epica'
    when 'waspy' then 'rara'
    when 'diegkeye' then 'comune'
    when 'gokiele' then 'leggendaria'
    when 'vegerizio' then 'leggendaria'
    when 'brolymone' then 'leggendaria'
    when 'freezovico' then 'rara'
    when 'gohanlollo' then 'rara'
    when 'pipsccolo' then 'epica'
    when 'caulifrita' then 'epica'
    when 'criliziano' then 'rara'
    when 'bulsene' then 'epica'
    when 'c18ora' then 'epica'
    when 'diego17' then 'rara'
    when 'chichice' then 'comune'
    when 'vidalessia' then 'comune'
    when 'panky' then 'comune'
    when 'giulmai' then 'comune'
    when 'zeutiz' then 'leggendaria'
    when 'poseludovico' then 'epica'
    when 'adelrizio' then 'comune'
    when 'aresorenzo' then 'epica'
    when 'atharita' then 'leggendaria'
    when 'artalice' then 'epica'
    when 'aurera' then 'epica'
    when 'herdiego' then 'rara'
    when 'efesamuele' then 'rara'
    when 'dionpips' then 'comune'
    when 'nikulia' then 'leggendaria'
    when 'solmone' then 'comune'
    when 'aphroalessia' then 'comune'
    when 'demviky' then 'rara'
    when 'persene' then 'rara'
    when 'ellobo' then 'epica'
    when 'eltigre' then 'epica'
    when 'elcuervo' then 'rara'
    when 'labruja' then 'rara'
    when 'lasombra' then 'comune'
    when 'samulett' then 'epica'
    when 'mauriziente' then 'epica'
    when 'simoldemort' then 'leggendaria'
    when 'pipverus' then 'leggendaria'
    when 'vikatrix' then 'leggendaria'
    when 'alessmione' then 'leggendaria'
    when 'seneverr' then 'epica'
    when 'diegirius' then 'epica'
    when 'ludraco' then 'rara'
    when 'ritadora' then 'rara'
    when 'lollon' then 'comune'
    when 'ginice' then 'comune'
    when 'tizievil' then 'comune'
    when 'auroruna' then 'rara'
    when 'giulifleur' then 'rara'
    when 'lollifer' then 'leggendaria'
    when 'samuzebub' then 'leggendaria'
    when 'simothan' then 'epica'
    when 'alissith' then 'leggendaria'
    when 'mauriphomet' then 'rara'
    when 'ludomodeus' then 'epica'
    when 'tiziazel' then 'rara'
    when 'aurorrigan' then 'leggendaria'
    when 'pipmon' then 'rara'
    when 'diegial' then 'comune'
    when 'ritacubus' then 'epica'
    when 'alistaroth' then 'rara'
    when 'giulimaah' then 'epica'
    when 'vikamashtu' then 'comune'
    when 'senecate' then 'comune'
    when 'ludhacker' then 'leggendaria'
    when 'lollinista' then 'rara'
    when 'tiziegista' then 'leggendaria'
    when 'alispia' then 'leggendaria'
    when 'senebroker' then 'leggendaria'
    when 'maurialpinista' then 'rara'
    when 'pipciatore' then 'epica'
    when 'simonducer' then 'rara'
    when 'diegarman' then 'epica'
    when 'samutografo' then 'comune'
    when 'alessiologa' then 'epica'
    when 'vikyventura' then 'epica'
    when 'auroressa' then 'rara'
    when 'ritanimatrice' then 'comune'
    when 'giudella' then 'comune'
    when 'tizomer' then 'epica'
    when 'lollart' then 'leggendaria'
    when 'alisa' then 'leggendaria'
    when 'simarney' then 'rara'
    when 'maurilanders' then 'epica'
    when 'samusty' then 'rara'
    when 'dieggum' then 'leggendaria'
    when 'pimoe' then 'rara'
    when 'ludohouse' then 'comune'
    when 'alledna' then 'rara'
    when 'vaggie' then 'epica'
    when 'giupatty' then 'epica'
    when 'selmene' then 'comune'
    when 'riessica' then 'comune'
    when 'aurrerri' then 'comune'
    when 'diegopa' then 'leggendaria'
    when 'pipsoba' then 'leggendaria'
    when 'ritamma' then 'leggendaria'
    when 'aliottina' then 'epica'
    when 'aurobrava' then 'epica'
    when 'ludopa' then 'epica'
    when 'mauriba' then 'epica'
    when 'alebella' then 'rara'
    when 'giulialla' then 'rara'
    when 'seneforte' then 'rara'
    when 'vikylalla' then 'rara'
    when 'lollapa' then 'comune'
    when 'tizoba' then 'comune'
    when 'samuba' then 'comune'
    when 'simopa' then 'comune'
    when 'ludowalker' then 'leggendaria'
    when 'giueia' then 'leggendaria'
    when 'mauribecca' then 'leggendaria'
    when 'lollakin' then 'epica'
    when 'tizvader' then 'epica'
    when 'simalpatine' then 'epica'
    when 'samuwan' then 'epica'
    when 'aleadme' then 'rara'
    when 'alihsoka' then 'rara'
    when 'pipsobafett' then 'rara'
    when 'ritey' then 'rara'
    when 'aurothma' then 'comune'
    when 'diegoren' then 'comune'
    when 'senendulla' then 'comune'
    when 'vikyerso' then 'comune'
    when 'auraria' then 'leggendaria'
    when 'senesuono' then 'leggendaria'
    when 'vikytal' then 'leggendaria'
    when 'alessieno' then 'epica'
    when 'diegaqua' then 'epica'
    when 'pipgelo' then 'epica'
    when 'ritacrys' then 'epica'
    when 'alisombra' then 'rara'
    when 'giuliflora' then 'rara'
    when 'simoluce' then 'rara'
    when 'tiziamma' then 'rara'
    when 'lollonova' then 'comune'
    when 'ludomagma' then 'comune'
    when 'mauricore' then 'comune'
    when 'samulmine' then 'comune'
    when 'lollendigo' then 'leggendaria'
    when 'senelagoon' then 'leggendaria'
    when 'vikyeletro' then 'leggendaria'
    when 'aligorgona' then 'epica'
    when 'giulistrega' then 'epica'
    when 'samulupo' then 'epica'
    when 'simospirit' then 'epica'
    when 'auranshee' then 'rara'
    when 'diegombie' then 'rara'
    when 'ludogargo' then 'rara'
    when 'maurimmia' then 'rara'
    when 'alessiaracne' then 'comune'
    when 'pipkenstein' then 'comune'
    when 'ritarena' then 'comune'
    when 'tizidrac' then 'comune'
    when 'alessiai' then 'leggendaria'
    when 'diegobot' then 'leggendaria'
    when 'ritron' then 'leggendaria'
    when 'piptron' then 'epica'
    when 'senetron' then 'epica'
    when 'tizitron' then 'epica'
    when 'vikybyte' then 'epica'
    when 'giulibyte' then 'rara'
    when 'lolloborg' then 'rara'
    when 'ludovolt' then 'rara'
    when 'samulex' then 'rara'
    when 'alicircuit' then 'comune'
    when 'auroroide' then 'comune'
    when 'mauriborg' then 'comune'
    when 'simonex' then 'comune'
    when 'alire' then 'leggendaria'
    when 'maurire' then 'leggendaria'
    when 'tizire' then 'leggendaria'
    when 'giulasso' then 'epica'
    when 'lollocallo' then 'epica'
    when 'ludasso' then 'epica'
    when 'samasso' then 'epica'
    when 'pipsante' then 'rara'
    when 'ritare' then 'rara'
    when 'senecallo' then 'rara'
    when 'vikante' then 'rara'
    when 'alessante' then 'comune'
    when 'aurante' then 'comune'
    when 'diegallo' then 'comune'
    when 'simocallo' then 'comune'
    when 'aurorecia' then 'leggendaria'
    when 'pipscozia' then 'leggendaria'
    when 'simonusa' then 'leggendaria'
    when 'aleghilterra' then 'epica'
    when 'diegspagna' then 'epica'
    when 'ritalia' then 'epica'
    when 'samubrasil' then 'epica'
    when 'maurigitto' then 'rara'
    when 'senesia' then 'rara'
    when 'tizgeria' then 'rara'
    when 'vikappone' then 'rara'
    when 'alirtogallo' then 'comune'
    when 'giulancia' then 'comune'
    when 'lollirlanda' then 'comune'
    when 'ludormania' then 'comune'
    when 'seneloon' then 'leggendaria'
    when 'giuvlass' then 'leggendaria'
    when 'ludobunty' then 'leggendaria'
    when 'alicolt' then 'epica'
    when 'auroraider' then 'epica'
    when 'lollawless' then 'epica'
    when 'simarshal' then 'epica'
    when 'alessoutlaw' then 'rara'
    when 'dieganger' then 'rara'
    when 'mauribandit' then 'rara'
    when 'samuero' then 'rara'
    when 'pipstolero' then 'comune'
    when 'ritaloon' then 'comune'
    when 'tiziariffo' then 'comune'
    when 'vikylasso' then 'comune'
    when 'dieghunter' then 'leggendaria'
    when 'pipscience' then 'leggendaria'
    when 'ritageddon' then 'leggendaria'
    when 'alesshack' then 'epica'
    when 'maurizomb' then 'epica'
    when 'tizianator' then 'epica'
    when 'vikydead' then 'epica'
    when 'alizombie' then 'rara'
    when 'auroravive' then 'rara'
    when 'lollivor' then 'rara'
    when 'simopter' then 'rara'
    when 'giulimort' then 'comune'
    when 'ludovirus' then 'comune'
    when 'samudead' then 'comune'
    when 'senemune' then 'comune'
    when 'samuruele' then 'leggendaria'
    when 'lollorochi' then 'leggendaria'
    when 'tizunagi' then 'leggendaria'
    when 'diegami' then 'epica'
    when 'aurokitsune' then 'epica'
    when 'maurioni' then 'epica'
    when 'simotengu' then 'epica'
    when 'alikami' then 'rara'
    when 'giulyokai' then 'rara'
    when 'ludoninja' then 'rara'
    when 'alesshogun' then 'rara'
    when 'ritamiko' then 'comune'
    when 'pipsuki' then 'comune'
    when 'seneko' then 'comune'
    when 'vikitsune' then 'comune'
  end;
$$;
-- FINE RARITA
create or replace function public.rarita_carta(carta text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select case when dati->'carte'->carta->>'rarita' in ('comune', 'rara', 'epica', 'leggendaria', 'ultra') then dati->'carte'->carta->>'rarita' end
                   from public.config where id = 'carte'), public.rarita_base(carta));
$$;
create or replace function public.costo_scambio(carta text) returns integer
language sql stable security definer set search_path = public as $$
  select case public.rarita_carta(carta) when 'comune' then 10 when 'rara' then 12 when 'epica' then 24 when 'leggendaria' then 60 when 'ultra' then 120 end;
$$;
create or replace function public.possiede(u uuid, carta text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select case when dati->'carte'->>carta ~ '^[0-9]+$' then (dati->'carte'->>carta)::int end from public.salvataggi where user_id = u and slot = 'partita'), 0) > 0;
$$;
-- potenziatori di una carta che un giocatore può ancora dare: quelli nel salvataggio, meno quelli promessi in scambi aperti
-- e quelli di scambi già fatti ma non ancora arrivati nel suo salvataggio
create or replace function public.pot_liberi(u uuid, carta text, tranne bigint default null) returns integer
language sql stable security definer set search_path = public as $$
  with s as (select dati, aggiornato from public.salvataggi where user_id = u and slot = 'partita')
  select coalesce((select case when dati->'pot'->>carta ~ '^[0-9]+(\.[0-9]+)?$' then floor((dati->'pot'->>carta)::numeric)::int end from s), 0)
       - coalesce(public.costo_scambio(carta), 0) * (
           (select count(*) from public.scambi x where x.id <> coalesce(tranne, -1) and x.da = u and x.offro = carta
              and (x.stato = 'aperto' or (x.stato = 'accettato' and (not x.ritirato or x.ritirato_il > coalesce((select aggiornato from s), now())))))
         + (select count(*) from public.scambi x where x.id <> coalesce(tranne, -1) and x.a = u and x.chiedo = carta
              and x.stato = 'accettato' and x.chiuso > coalesce((select aggiornato from s), now())))::int;
$$;

create or replace function public.proponi_scambio(amico uuid, offro text, chiedo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); nuovo bigint; costo int; liberi int;
begin
  if me is null then raise exception 'Devi fare l''accesso'; end if;
  if amico = me then raise exception 'Non puoi scambiare con te stesso'; end if;
  if offro = chiedo then raise exception 'Scegli due carte diverse'; end if;
  if public.rarita_carta(offro) is null or public.rarita_carta(chiedo) is null then raise exception 'Carta sconosciuta'; end if;
  if public.rarita_carta(offro) <> public.rarita_carta(chiedo) then raise exception 'Si scambia solo tra carte della stessa rarità'; end if;
  costo := public.costo_scambio(offro);
  if not public.possiede(me, offro) then raise exception 'Non hai questa carta'; end if;
  liberi := public.pot_liberi(me, offro);
  if liberi < costo then raise exception 'Per offrire questa carta servono % potenziatori suoi: ne hai % liberi', costo, greatest(liberi, 0); end if;
  if not public.possiede(amico, chiedo) or public.pot_liberi(amico, chiedo) < costo then raise exception 'Il tuo amico non ha abbastanza potenziatori di questa carta per scambiarla'; end if;
  if (select count(*) from public.scambi where da = me and stato = 'aperto') >= 5 then raise exception 'Hai già 5 proposte aperte: aspetta che ti rispondano o annullane una'; end if;
  if exists (select 1 from public.scambi s where s.da = me and s.a = amico and s.chiedo = proponi_scambio.chiedo and s.stato = 'aperto') then raise exception 'Hai già chiesto questa carta a questo amico'; end if;
  insert into public.scambi (da, a, offro, chiedo) values (me, amico, offro, chiedo) returning id into nuovo;
  return jsonb_build_object('id', nuovo, 'costo', costo);
end $$;

create or replace function public.rispondi_scambio(scambio bigint, accetto boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare x public.scambi; costo int;
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
  costo := public.costo_scambio(x.chiedo);
  if public.pot_liberi(x.a, x.chiedo, x.id) < costo then raise exception 'Per dare questa carta servono % potenziatori suoi e non li hai più', costo; end if;
  if public.pot_liberi(x.da, x.offro, x.id) < public.costo_scambio(x.offro) then
    update public.scambi set stato = 'annullato', chiuso = now() where id = scambio;
    raise exception 'Il tuo amico non ha più i potenziatori per la carta che offriva: proposta annullata';
  end if;
  update public.scambi set stato = 'accettato', chiuso = now() where id = scambio;
  -- chi accetta riceve subito: il gioco toglie i potenziatori di "chiedo" e aggiunge la carta "offro"
  -- se la carta ce l'ha già, il gioco gli dà i potenziatori di un doppione (come prima, ma per tutte le carte)
  return jsonb_build_object('stato', 'accettato', 'dai', x.chiedo, 'ricevi', x.offro, 'costo', costo, 'ce_lha', public.possiede(x.a, x.offro));
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
    update public.scambi set ritirato = true, ritirato_il = now()
    where da = auth.uid() and stato = 'accettato' and not ritirato
    returning id, offro, chiedo
  ) select coalesce(jsonb_agg(jsonb_build_object('id', id, 'dai', offro, 'ricevi', chiedo, 'costo', public.costo_scambio(offro))), '[]'::jsonb) into r from presi;
  return r;
end $$;

-- Le carte di un amico che si possono chiedere: quelle per cui ha abbastanza potenziatori liberi (solo gli id)
create or replace function public.doppioni_amico(amico uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(k), '[]'::jsonb) from (
    select k from public.salvataggi s, jsonb_each_text(coalesce(s.dati->'carte', '{}'::jsonb)) as e(k, v)
    where s.user_id = amico and s.slot = 'partita' and auth.uid() is not null and v ~ '^[0-9]+$' and v::int > 0
      and public.costo_scambio(k) is not null and public.pot_liberi(amico, k) >= public.costo_scambio(k)
  ) t;
$$;
drop function if exists public.copie_libere(uuid, text, bigint);
revoke all on function public.rarita_carta(text), public.costo_scambio(text), public.possiede(uuid, text), public.pot_liberi(uuid, text, bigint),
  public.proponi_scambio(uuid, text, text), public.rispondi_scambio(bigint, boolean), public.annulla_scambio(bigint), public.ritira_scambi(), public.doppioni_amico(uuid) from public, anon;
grant execute on function public.proponi_scambio(uuid, text, text), public.rispondi_scambio(bigint, boolean), public.annulla_scambio(bigint), public.ritira_scambi(), public.doppioni_amico(uuid) to authenticated;

-- le proposte aperte fatte con le vecchie regole (doppioni) che con le nuove non stanno in piedi vengono annullate
update public.scambi x set stato = 'annullato', chiuso = now()
where x.stato = 'aperto' and (
  public.rarita_carta(x.offro) is distinct from public.rarita_carta(x.chiedo)
  or public.pot_liberi(x.da, x.offro, x.id) < coalesce(public.costo_scambio(x.offro), 0)
  or public.pot_liberi(x.a, x.chiedo, x.id) < coalesce(public.costo_scambio(x.chiedo), 0));

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

create or replace function public.pv_boss_nuovo() returns integer
language sql stable security definer set search_path = public as $$
  select greatest(20000, 6000 * (select count(*) from public.salvataggi where slot = 'partita' and aggiornato > now() - interval '14 days'))::int;
$$;
-- il boss di questa settimana, se era stato creato con i PV vecchi (troppi), si abbassa
update public.boss_settimana set pv_max = least(pv_max, public.pv_boss_nuovo()) where settimana = to_char(now() at time zone 'Europe/Rome', 'IYYY-"W"IW');
create or replace function public.boss_attuale() returns jsonb
language plpgsql security definer set search_path = public as $$
declare s text := public.settimana_attuale(); oggi date := (now() at time zone 'Europe/Rome')::date; b public.boss_settimana; tot int;
begin
  if auth.uid() is null then raise exception 'Devi fare l''accesso'; end if;
  -- i PV crescono con quanti giocano: 6.000 per ogni giocatore attivo nelle ultime 2 settimane (almeno 20.000).
  -- Un attacco fa in media 700-800 danni: servono circa 8 attacchi a testa nella settimana (se ne hanno 21).
  insert into public.boss_settimana (settimana, pv_max)
    values (s, public.pv_boss_nuovo())
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
-- Registro delle cose sospette: lo legge solo l'admin (pannello Admin → Controlli)
create table if not exists public.registro (
  id       bigint generated always as identity primary key,
  user_id  uuid references auth.users (id) on delete cascade,
  tipo     text not null,
  dettagli jsonb not null default '{}'::jsonb,
  quando   timestamptz not null default now()
);
create index if not exists registro_quando on public.registro (quando desc);
alter table public.registro enable row level security;
drop policy if exists "registro: solo l'admin" on public.registro;
create policy "registro: solo l'admin" on public.registro for select to authenticated using (public.sono_admin());
grant select on public.registro to authenticated;
revoke all on public.registro from anon;

-- I titoli dei trofei: il testo lo decide il server, il gioco manda solo quale trofeo vuole mostrare
create or replace function public.testo_titolo(t text) returns text
language sql immutable as $$
  select case t
    when 'vittoria-1' then 'Recluta' when 'vittorie-50' then 'Veterano' when 'vittorie-200' then 'Leggenda'
    when 'carte-25' then 'Collezionista' when 'carte-50' then 'Archivista' when 'carte-tutte' then 'Completista'
    when 'serie-eroi' then 'Supereroe' when 'serie-db' then 'Guerriero leggendario' when 'serie-dei' then 'Divinità'
    when 'serie-nueve' then 'Boss della mala' when 'serie-maghi' then 'Arcimago' when 'serie-demoni' then 'Signore degli Inferi' when 'serie-mestieri' then 'Stacanovista' when 'serie-simpson' then 'Re di Springfield' when 'serie-barbapapa' then 'Barbatrucco' when 'serie-starwars' then 'Maestro Jedi' when 'serie-elementi' then 'Avatar degli Elementi' when 'serie-creature' then 'Signore della Notte' when 'serie-cyborg' then 'Cyborg Supremo' when 'serie-carte' then 'Re del Mazzo' when 'serie-paesi' then 'Cittadino del Mondo' when 'serie-farwest' then 'Sceriffo della Frontiera' when 'serie-apocalisse' then 'Ultimo Sopravvissuto' when 'serie-giappone' then 'Shogun del Sol Levante' when 'giocatore-10' then 'Veterano' when 'giocatore-20' then 'Campione' when 'giocatore-30' then 'Gran Maestro' when 'giocatore-40' then 'Leggenda vivente' when 'giocatore-50' then 'Mito del Noiverso' when 'giocatore-60' then 'Signore delle carte' when 'giocatore-70' then 'Imbattibile' when 'giocatore-80' then 'Leggenda del gruppo' when 'giocatore-90' then 'Semidio' when 'giocatore-100' then 'Il Numero Uno'
    when 'olo-1' then 'Brillante' when 'olo-5' then 'Arcobaleno' when 'livello-10' then 'Allenatore' when 'livello-30' then 'Maestro'
    when 'lode-1' then 'Lodato' when 'bustine-50' then 'Strappabustine' when 'stelle-30' then 'Narratore' when 'stelle-120' then 'Giramondo' when 'ultra-1' then 'Ultra' when 'pass-50' then 'Fedelissimo'
    when 'accessi-7' then 'Sempre presente' when 'amici-10' then 'Bullo di quartiere' when 'boss-20000' then 'Ammazzaboss' when 'scambi-3' then 'Mercante'
    when 'vivo-5' then 'Campione dal vivo'
  end
$$;
-- Il trofeo risulta davvero conquistato? Dove si può, lo verifica sui dati del server (sfide, boss, scambi) o del salvataggio.
create or replace function public.titolo_valido(u uuid, t text, d jsonb) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare n int; carte int := (select count(*) from jsonb_object_keys(coalesce(d->'carte', '{}'::jsonb)));
  olo int := (select count(*) from jsonb_each_text(coalesce(d->'olo', '{}'::jsonb)) where value = 'true');
  liv int := coalesce((select max(value::int) from jsonb_each_text(coalesce(d->'liv', '{}'::jsonb)) where value ~ '^[0-9]+$'), 1);
  st jsonb := coalesce(d->'stats', '{}'::jsonb);
begin
  if t is null or public.testo_titolo(t) is null or not coalesce((d->'trofei'->>t)::boolean, false) then return false; end if;
  return case
    when t = 'vittoria-1' then coalesce((st->>'vittorie')::int, 0) >= 1
    when t = 'vittorie-50' then coalesce((st->>'vittorie')::int, 0) >= 50
    when t = 'vittorie-200' then coalesce((st->>'vittorie')::int, 0) >= 200
    when t = 'carte-25' then carte >= 25
    when t = 'carte-50' then carte >= 50
    when t = 'carte-tutte' then carte >= 70
    when t like 'serie-%' then carte >= 12
    when t = 'olo-1' then olo >= 1
    when t = 'olo-5' then olo >= 5
    when t = 'livello-10' then liv >= 10
    when t = 'livello-30' then liv >= 30
    when t = 'lode-1' then exists (select 1 from jsonb_each_text(coalesce(d->'lodeXp', '{}'::jsonb)) where value ~ '^[0-9]+$' and value::int >= 2000)
    when t = 'bustine-50' then coalesce((st->>'bustine')::int, 0) >= 50
    when t = 'stelle-30' then coalesce((select sum(value::int) from jsonb_each_text(coalesce(d->'storia'->'stelle', '{}'::jsonb)) where value ~ '^[0-9]+$'), 0) >= 30
    when t = 'ultra-1' then exists (select 1 from jsonb_each_text(coalesce(d->'ultra', '{}'::jsonb)) e(k, v) where v = 'true')
    when t = 'stelle-120' then coalesce((select sum(value::int) from jsonb_each_text(coalesce(d->'storia'->'stelle', '{}'::jsonb)) where value ~ '^[0-9]+$'), 0) >= 120
    when t = 'pass-50' then coalesce((d->'pass'->>'xp')::int, 0) >= 50 * 200
    when t = 'accessi-7' then coalesce((st->>'serieMax')::int, 0) >= 7
    when t = 'amici-10' then (select count(*) from public.sfide_amici where sfidante = u and vinto) >= 10
    when t = 'boss-20000' then coalesce((select sum(danni) from public.boss_danni where user_id = u), 0) >= 20000
    when t = 'scambi-3' then (select count(*) from public.scambi where (da = u or a = u) and stato = 'accettato') >= 3
    when t = 'vivo-5' then (select count(*) from public.partite_vivo where vincitore = u and stato = 'ok') >= 5
    -- livello giocatore (nov 2026): punti Fama salvati in lv.punti; per arrivare al livello L ne servono 90·(L-1) + 5·(L-1)·(L-2)
    when t like 'giocatore-%' then coalesce((d->'lv'->>'punti')::numeric, 0) >= 90 * (substring(t from 11)::int - 1) + 5 * (substring(t from 11)::int - 1) * (substring(t from 11)::int - 2)
    else false end;
end $$;
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
  -- nov 2026: frammenti, Arena e maestria hanno limiti che giocando non si superano mai
  if coalesce((d->>'framm')::numeric, 0) < 0 or coalesce((d->>'framm')::numeric, 0) > 200000 then
    raise exception 'Salvataggio non valido (frammenti)';
  end if;
  if jsonb_typeof(d->'arena') = 'object' and (coalesce((d->'arena'->>'vinte')::int, 0) > 7 or coalesce((d->'arena'->>'perse')::int, 0) > 3
       or jsonb_array_length(case when jsonb_typeof(d->'arena'->'scelte') = 'array' then d->'arena'->'scelte' else '[]'::jsonb end) > 5) then
    raise exception 'Salvataggio non valido (Arena)';
  end if;
  if jsonb_typeof(d->'maestria') = 'object' and exists (select 1 from jsonb_each(d->'maestria') e(k, m)
       where jsonb_typeof(m->'presi') = 'array' and jsonb_array_length(m->'presi') > 5) then
    raise exception 'Salvataggio non valido (maestria)';
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
    -- salti grandi ma ancora possibili: li annoto per l'admin (un premio grosso li spiega, tanti di fila no)
    if coalesce((d->>'monete')::numeric, 0) - coalesce((vecchio->>'monete')::numeric, 0) > 5000 then
      insert into public.registro (user_id, tipo, dettagli) values (new.user_id, 'monete',
        jsonb_build_object('da', coalesce((vecchio->>'monete')::numeric, 0), 'a', coalesce((d->>'monete')::numeric, 0)));
    end if;
    -- nov 2026: altri salti sospetti (non bloccano, finiscono nel registro dell'admin)
    if coalesce((d->'lv'->>'punti')::numeric, 0) - coalesce((vecchio->'lv'->>'punti')::numeric, 0) > 1500 then
      insert into public.registro (user_id, tipo, dettagli) values (new.user_id, 'livello',
        jsonb_build_object('da', coalesce((vecchio->'lv'->>'punti')::numeric, 0), 'a', coalesce((d->'lv'->>'punti')::numeric, 0)));
    end if;
    if coalesce((d->>'framm')::numeric, 0) - coalesce((vecchio->>'framm')::numeric, 0) > 1500 then
      insert into public.registro (user_id, tipo, dettagli) values (new.user_id, 'frammenti',
        jsonb_build_object('da', coalesce((vecchio->>'framm')::numeric, 0), 'a', coalesce((d->>'framm')::numeric, 0)));
    end if;
    if (select count(*) from jsonb_each_text(coalesce(d->'carte', '{}'::jsonb)) where value ~ '^[0-9]+$' and value::int > 0)
       - (select count(*) from jsonb_each_text(coalesce(vecchio->'carte', '{}'::jsonb)) where value ~ '^[0-9]+$' and value::int > 0) > 40 then
      insert into public.registro (user_id, tipo, dettagli) values (new.user_id, 'carte',
        jsonb_build_object('nuove', (select count(*) from jsonb_each_text(coalesce(d->'carte', '{}'::jsonb)) where value ~ '^[0-9]+$' and value::int > 0)
          - (select count(*) from jsonb_each_text(coalesce(vecchio->'carte', '{}'::jsonb)) where value ~ '^[0-9]+$' and value::int > 0)));
    end if;
    if coalesce((d->'stats'->>'vittorie')::int, 0) - coalesce((vecchio->'stats'->>'vittorie')::int, 0) > 5 then
      insert into public.registro (user_id, tipo, dettagli) values (new.user_id, 'vittorie',
        jsonb_build_object('da', coalesce((vecchio->'stats'->>'vittorie')::int, 0), 'a', coalesce((d->'stats'->>'vittorie')::int, 0)));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists controlla_salvataggio on public.salvataggi;
create trigger controlla_salvataggio before insert or update on public.salvataggi
  for each row execute function public.controlla_salvataggio();

-- ---------------- Azzerare la classifica (es. ogni mese) ----------------
-- La classifica conta le partite dal vivo giocate da "dal" in poi (config 'classifica').
-- Azzerarla vuol dire spostare "dal" ad adesso: le partite restano (servono ai trofei), contano solo da qui in avanti.
-- Prima di azzerare, il podio finisce nello storico.
create or replace function public.inizio_classifica() returns timestamptz
language sql stable security definer set search_path = public as $$
  select coalesce((select (dati->>'dal')::timestamptz from public.config where id = 'classifica'), '-infinity'::timestamptz);
$$;
create or replace function public.titolo_mese(t timestamptz) returns text
language sql immutable as $$
  select 'Classifica di ' || (array['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'])[extract(month from t at time zone 'Europe/Rome')::int]
         || ' ' || extract(year from t at time zone 'Europe/Rome')::int;
$$;
create or replace function public.titolo_classifica(titolo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sono_admin() then raise exception 'Solo l''admin può cambiare il titolo'; end if;
  titolo := left(trim(coalesce(titolo, '')), 60);
  insert into public.config (id, dati) values ('classifica', jsonb_build_object('titolo', titolo))
    on conflict (id) do update set dati = public.config.dati || jsonb_build_object('titolo', titolo), aggiornato = now();
end $$;
-- se la classifica non ha ancora un titolo, prende quello del mese in corso
insert into public.config (id, dati) values ('classifica', jsonb_build_object('titolo', public.titolo_mese(now())))
  on conflict (id) do update set dati = public.config.dati || jsonb_build_object('titolo', public.titolo_mese(now())) where not (public.config.dati ? 'titolo');
revoke all on function public.titolo_classifica(text) from public, anon;
grant execute on function public.titolo_classifica(text) to authenticated;
-- Premi per i primi 3 quando si azzera la classifica: restano in attesa finché il giocatore non apre il gioco
create table if not exists public.premi_classifica (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users (id) on delete cascade,
  posizione integer not null,
  titolo    text,
  punti     integer not null default 0,
  premio    jsonb not null,
  riscosso  boolean not null default false,
  creato    timestamptz not null default now()
);
create index if not exists premi_classifica_utente on public.premi_classifica (user_id, riscosso);
alter table public.premi_classifica add column if not exists tipo text not null default 'classifica';
alter table public.premi_classifica enable row level security;
drop policy if exists "premi classifica: i miei" on public.premi_classifica;
create policy "premi classifica: i miei" on public.premi_classifica for select to authenticated using (user_id = auth.uid());
grant select on public.premi_classifica to authenticated;
revoke all on public.premi_classifica from anon;
create or replace function public.premio_posizione(pos integer) returns jsonb language sql immutable as $$
  select case pos
    when 1 then '{"monete": 1000, "bustine": {"leggendaria": 1}}'::jsonb
    when 2 then '{"monete": 600, "bustine": {"epica": 1}}'::jsonb
    when 3 then '{"monete": 300, "bustine": {"normale": 2}}'::jsonb
  end;
$$;
create or replace function public.riscatta_premi_classifica() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  with presi as (update public.premi_classifica set riscosso = true where user_id = auth.uid() and not riscosso returning posizione, titolo, punti, premio, tipo)
  select coalesce(jsonb_agg(jsonb_build_object('posizione', posizione, 'titolo', titolo, 'punti', punti, 'premio', premio, 'tipo', tipo) order by posizione), '[]'::jsonb) into r from presi;
  return r;
end $$;
revoke all on function public.riscatta_premi_classifica() from public, anon;
grant execute on function public.riscatta_premi_classifica() to authenticated;

-- un numero dai dati della classifica (0 se manca o non è un numero): serve per gli spareggi
create or replace function public.num_dati(d jsonb, k text) returns integer
language sql immutable as $$ select case when d->>k ~ '^[0-9]+$' then (d->>k)::int else 0 end $$;

create or replace function public.azzera_classifica() returns jsonb
language plpgsql security definer set search_path = public as $$
declare podio jsonb; vecchio jsonb;
begin
  if not public.sono_admin() then raise exception 'Solo l''admin può azzerare la classifica'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('nome', coalesce(dati->>'nome', 'Giocatore'), 'avatar', dati->>'avatar', 'punti', punti) order by ord), '[]'::jsonb) into podio
    from (select dati, punti, row_number() over (order by punti desc, public.num_dati(dati, 'livello') desc, public.num_dati(dati, 'pass') desc, public.num_dati(dati, 'carte') desc, public.num_dati(dati, 'giocate_vivo') desc, aggiornato asc) as ord from public.classifica where punti > 0) t where ord <= 3;
  select dati into vecchio from public.config where id = 'classifica';
  -- premi ai primi 3 (solo a chi ha fatto almeno un punto)
  insert into public.premi_classifica (user_id, posizione, titolo, punti, premio)
    select user_id, pos, coalesce(vecchio->>'titolo', 'Classifica'), punti, public.premio_posizione(pos::int)
    from (select user_id, punti, row_number() over (order by punti desc, public.num_dati(dati, 'livello') desc, public.num_dati(dati, 'pass') desc, public.num_dati(dati, 'carte') desc, public.num_dati(dati, 'giocate_vivo') desc, aggiornato asc) as pos from public.classifica where punti > 0) t where pos <= 3;
  insert into public.config (id, dati) values ('classifica', jsonb_build_object('dal', now(), 'titolo', public.titolo_mese(now()),
      'storico', (jsonb_build_array(jsonb_build_object('dal', vecchio->>'dal', 'al', now(), 'titolo', vecchio->>'titolo', 'podio', podio)) || coalesce(vecchio->'storico', '[]'::jsonb)) - 12))
    on conflict (id) do update set dati = excluded.dati, aggiornato = now();
  update public.classifica set aggiornato = now() where user_id is not null;   -- ricalcola i punti di tutti (Supabase vuole sempre un WHERE)
  return jsonb_build_object('podio', podio);
end $$;
revoke all on function public.azzera_classifica() from public, anon;
grant execute on function public.azzera_classifica() to authenticated;

-- Livello giocatore (nov 2026) dai punti Fama del salvataggio: per arrivare al livello L servono 90·(L-1) + 5·(L-1)·(L-2) punti.
-- Con n = L-1: 5n² + 85n ≤ punti  →  n = parte intera di (-85 + √(7225 + 20·punti)) / 10. Massimo 100.
create or replace function public.livello_giocatore(d jsonb) returns integer
language sql immutable as $$
  select least(100, greatest(1, floor((-85 + sqrt(7225 + 20 * greatest(0, coalesce(
    case when d->'lv'->>'punti' ~ '^[0-9]+(\.[0-9]+)?$' then (d->'lv'->>'punti')::numeric end, 0)))) / 10)::int + 1))
$$;

-- nov 2026: cosmetico scelto, solo se risulta sbloccato nel salvataggio
create or replace function public.cosm_valido(s jsonb, tipo text) returns text
language sql immutable as $$
  select case when coalesce(s->'cosm'->>tipo, '') ~ '^[a-z0-9-]{1,30}$'
              and jsonb_typeof(s->'cosm'->'have') = 'object'
              and coalesce(s->'cosm'->'have'->>(s->'cosm'->>tipo), '') = 'true'
         then s->'cosm'->>tipo else '' end
$$;

create or replace function public.classifica_vera() returns trigger
language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  -- i numeri in classifica arrivano dal salvataggio, non da quello che manda il dispositivo
  select dati into s from public.salvataggi where user_id = new.user_id and slot = 'partita';
  -- i punti in classifica vengono solo dalle sfide dal vivo: +3 per ogni vittoria, 0 per le sconfitte
  new.punti := coalesce((select sum(punti) from public.partite_vivo where vincitore = new.user_id and stato in ('ok', 'abbandono') and creata >= public.inizio_classifica()), 0);
  -- il titolo si vede solo se il trofeo risulta davvero conquistato (altrimenti finisce nel registro)
  if new.dati ? 'titolo_id' and coalesce(new.dati->>'titolo_id', '') <> '' and not public.titolo_valido(new.user_id, new.dati->>'titolo_id', s)
     and coalesce((select dati->>'titolo_id' from public.classifica where user_id = new.user_id), '') <> new.dati->>'titolo_id' then
    insert into public.registro (user_id, tipo, dettagli) values (new.user_id, 'titolo', jsonb_build_object('titolo', new.dati->>'titolo_id'));
  end if;
  new.dati := (coalesce(new.dati, '{}'::jsonb) - 'titolo') || jsonb_build_object('titolo',
    case when public.titolo_valido(new.user_id, new.dati->>'titolo_id', s) then public.testo_titolo(new.dati->>'titolo_id') end);
  -- l'avatar in classifica dev'essere una carta che il giocatore ha davvero trovato
  if coalesce(new.dati->>'avatar', '') <> '' and coalesce((s->'carte'->>(new.dati->>'avatar'))::int, 0) <= 0 then
    new.dati := new.dati || jsonb_build_object('avatar', '');
  end if;
  new.dati := coalesce(new.dati, '{}'::jsonb) || jsonb_build_object(
    'punti', new.punti,
    'vittorie', coalesce((s->'stats'->>'vittorie')::int, 0),
    'sconfitte', coalesce((s->'stats'->>'sconfitte')::int, 0),
    'carte', (select count(*) from jsonb_object_keys(coalesce(s->'carte', '{}'::jsonb))),
    'vinte_amici', (select count(*) from public.sfide_amici where (sfidante = new.user_id and vinto) or (sfidato = new.user_id and not vinto)),
    'vinte_vivo', (select count(*) from public.partite_vivo where vincitore = new.user_id and stato in ('ok', 'abbandono') and punti > 0 and creata >= public.inizio_classifica()),
    'giocate_vivo', (select count(*) from public.partite_vivo where (a = new.user_id or b = new.user_id) and stato in ('ok', 'abbandono') and creata >= public.inizio_classifica()),
    'livello', public.livello_giocatore(s));   -- nov 2026: il livello giocatore viene dal salvataggio, non dal dispositivo
  -- nov 2026: vetrina, cosmetici e statistiche del profilo (dal salvataggio; la vetrina solo con carte trovate davvero)
  new.dati := new.dati || jsonb_build_object(
    'vetrina', coalesce((select jsonb_agg(v) from (select v from jsonb_array_elements_text(case when jsonb_typeof(s->'vetrina') = 'array' then s->'vetrina' else '[]'::jsonb end) v
                 where v ~ '^[a-z0-9_-]{1,40}$' and coalesce((s->'carte'->>v)::int, 0) > 0 limit 3) x), '[]'::jsonb),
    'cornice', public.cosm_valido(s, 'cornice'),
    'stileNome', public.cosm_valido(s, 'nome'),
    'sfondo', public.cosm_valido(s, 'sfondo'),
    'stelle', (select coalesce(sum(jsonb_array_length(m->'presi')), 0) from jsonb_each(case when jsonb_typeof(s->'maestria') = 'object' then s->'maestria' else '{}'::jsonb end) e(k, m)
               where jsonb_typeof(m->'presi') = 'array'),
    'preferita', coalesce((select k from jsonb_each_text(case when jsonb_typeof(s->'usi') = 'object' then s->'usi' else '{}'::jsonb end) e(k, v)
               where v ~ '^[0-9]{1,9}$' and coalesce((s->'carte'->>k)::int, 0) > 0 order by v::int desc limit 1), ''),
    'seriePref', case when coalesce(new.dati->>'seriePref', '') ~ '^[a-z0-9]{1,20}$' then new.dati->>'seriePref' else '' end);
  new.aggiornato := now();
  return new;
end $$;
drop trigger if exists classifica_vera on public.classifica;
create trigger classifica_vera before insert or update on public.classifica
  for each row execute function public.classifica_vera();

-- quando un salvataggio cambia il livello giocatore, la riga in classifica si ricalcola subito
create or replace function public.salvataggio_livello() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.slot = 'partita' and (tg_op = 'INSERT' or public.livello_giocatore(new.dati) is distinct from public.livello_giocatore(old.dati)
      or new.dati->'vetrina' is distinct from old.dati->'vetrina' or new.dati->'cosm' is distinct from old.dati->'cosm') then
    update public.classifica set aggiornato = now() where user_id = new.user_id;
  end if;
  return null;
end $$;
drop trigger if exists salvataggio_livello on public.salvataggi;
create trigger salvataggio_livello after insert or update on public.salvataggi
  for each row execute function public.salvataggio_livello();

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
      return (k.premio - 'monete' - 'bustine' - 'bombolette' - 'oggetti' - 'carte') || jsonb_build_object('codice', k.codice, 'gia', true);
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

-- ---------------- Pannello controlli (solo admin) ----------------
-- Mette insieme le cose strane delle ultime 2 settimane: il registro più alcuni controlli fatti al momento.
create or replace function public.segnalazioni() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb := '[]'::jsonb;
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  -- 1. dal registro: titoli non validi, salti di monete e vittorie
  r := r || coalesce((select jsonb_agg(jsonb_build_object('user_id', user_id, 'tipo', tipo, 'dettagli', dettagli, 'quando', quando) order by quando desc)
    from (select * from public.registro where quando > now() - interval '14 days' order by quando desc limit 150) x), '[]'::jsonb);
  -- 2. sfide tra amici troppo veloci: due sfide dello stesso giocatore a meno di 25 secondi (una battaglia vera dura di più)
  r := r || coalesce((select jsonb_agg(jsonb_build_object('user_id', sfidante, 'tipo', 'sfide-veloci', 'dettagli', jsonb_build_object('quante', n, 'giorno', g), 'quando', ultimo))
    from (select sfidante, (quando at time zone 'Europe/Rome')::date g, count(*) n, max(quando) ultimo from (
            select sfidante, quando, quando - lag(quando) over (partition by sfidante order by quando) as dopo from public.sfide_amici where quando > now() - interval '14 days') y
          where dopo < interval '25 seconds' group by 1, 2) z), '[]'::jsonb);
  -- 3. sempre vittorie contro gli amici: almeno 8 sfide in 2 settimane e nessuna persa
  r := r || coalesce((select jsonb_agg(jsonb_build_object('user_id', sfidante, 'tipo', 'sempre-vinte', 'dettagli', jsonb_build_object('quante', n), 'quando', ultimo))
    from (select sfidante, count(*) n, max(quando) ultimo from public.sfide_amici where quando > now() - interval '14 days' group by 1 having count(*) >= 8 and bool_and(vinto)) z), '[]'::jsonb);
  -- 4. boss: media vicina al massimo per attacco (6.000)
  r := r || coalesce((select jsonb_agg(jsonb_build_object('user_id', user_id, 'tipo', 'boss-alto', 'dettagli', jsonb_build_object('media', media, 'colpi', colpi, 'settimana', settimana), 'quando', now()))
    from (select user_id, settimana, colpi, round(danni::numeric / nullif(colpi, 0)) media from public.boss_danni
          where settimana >= to_char(now() - interval '14 days', 'IYYY-"W"IW') and colpi >= 2 and danni::numeric / nullif(colpi, 0) >= 5000) z), '[]'::jsonb);
  -- i nomi dalla classifica
  return coalesce((select jsonb_agg(e || jsonb_build_object('nome', coalesce((select c.dati->>'nome' from public.classifica c where c.user_id = (e->>'user_id')::uuid), 'Giocatore')))
    from jsonb_array_elements(r) e), '[]'::jsonb);
end $$;

-- Rimedi: annullare le sfide tra amici degli ultimi giorni di un giocatore (i punti tornano a posto da soli)
create or replace function public.annulla_sfide_di(u uuid, giorni integer default 14) returns integer
language plpgsql security definer set search_path = public as $$
declare n int; vittime uuid[];
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  select array_agg(distinct sfidato) into vittime from public.sfide_amici where sfidante = u and quando > now() - make_interval(days => giorni);
  delete from public.sfide_amici where sfidante = u and quando > now() - make_interval(days => giorni);
  get diagnostics n = row_count;
  update public.classifica set aggiornato = now() where user_id = u or user_id = any (coalesce(vittime, '{}'));
  insert into public.registro (user_id, tipo, dettagli) values (u, 'rimedio', jsonb_build_object('cosa', 'sfide annullate', 'quante', n));
  return n;
end $$;
-- ... e azzerare i suoi danni al boss di questa settimana
create or replace function public.azzera_boss_di(u uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  update public.boss_danni set danni = 0 where user_id = u and settimana = public.settimana_attuale();
  insert into public.registro (user_id, tipo, dettagli) values (u, 'rimedio', jsonb_build_object('cosa', 'danni al boss azzerati'));
end $$;
revoke all on function public.segnalazioni(), public.annulla_sfide_di(uuid, integer), public.azzera_boss_di(uuid), public.titolo_valido(uuid, text, jsonb) from public, anon;
grant execute on function public.segnalazioni(), public.annulla_sfide_di(uuid, integer), public.azzera_boss_di(uuid) to authenticated;

-- Fine. Dopo esserti registrato nel gioco, esegui supabase/importa-progressi.sql
-- (porta i tuoi progressi e ti rende admin).

-- ============================================================
--  TORNEO DEL WEEKEND
--  L'admin crea il torneo e apre le iscrizioni; quando lo avvia si forma il tabellone (eliminazione diretta,
--  con i "passaggi del turno" se gli iscritti non sono 4, 8, 16…). Le partite si giocano come sfide dal vivo:
--  quando due giocatori che devono affrontarsi finiscono una sfida, il risultato vale per il torneo.
--  Ogni turno ha una scadenza; se una partita non si gioca, l'admin assegna la vittoria.
--  In finale si gioca anche la finalina per il 3° posto. I primi tre ricevono i premi (premi_classifica, tipo 'torneo').
-- ============================================================
create table if not exists public.tornei (
  id        bigint generated always as identity primary key,
  nome      text not null,
  stato     text not null default 'iscrizioni' check (stato in ('iscrizioni', 'in_corso', 'finito', 'annullato')),
  ore_turno integer not null default 24,
  premi     jsonb not null default '[]'::jsonb,
  creato    timestamptz not null default now(),
  iniziato  timestamptz,
  finito    timestamptz
);
create table if not exists public.tornei_iscritti (
  torneo  bigint not null references public.tornei (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome    text not null default 'Giocatore',
  avatar  text not null default '',
  primary key (torneo, user_id)
);
create table if not exists public.tornei_partite (
  id        bigint generated always as identity primary key,
  torneo    bigint not null references public.tornei (id) on delete cascade,
  turno     integer not null,
  n         integer not null,
  finalina  boolean not null default false,
  a         uuid,
  b         uuid,
  vincitore uuid,
  scadenza  timestamptz,
  chiusa    timestamptz,
  a_tavolino boolean not null default false,
  unique (torneo, turno, n, finalina)
);
alter table public.tornei enable row level security;
alter table public.tornei_iscritti enable row level security;
alter table public.tornei_partite enable row level security;
drop policy if exists "tornei: tutti li leggono" on public.tornei;
create policy "tornei: tutti li leggono" on public.tornei for select to authenticated using (true);
drop policy if exists "tornei iscritti: tutti li leggono" on public.tornei_iscritti;
create policy "tornei iscritti: tutti li leggono" on public.tornei_iscritti for select to authenticated using (true);
drop policy if exists "tornei partite: tutti le leggono" on public.tornei_partite;
create policy "tornei partite: tutti le leggono" on public.tornei_partite for select to authenticated using (true);

create or replace function public.crea_torneo(nome text, ore integer, premi jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare id bigint;
begin
  if not public.sono_admin() then raise exception 'Solo l''admin può creare un torneo'; end if;
  if exists (select 1 from public.tornei t where t.stato in ('iscrizioni', 'in_corso')) then raise exception 'C''è già un torneo aperto'; end if;
  insert into public.tornei (nome, ore_turno, premi) values (left(coalesce(nullif(trim(nome), ''), 'Torneo del weekend'), 40), greatest(1, least(168, coalesce(ore, 24))), coalesce(premi, '[]'::jsonb))
    returning tornei.id into id;
  return id;
end $$;

create or replace function public.iscriviti_torneo(si boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t public.tornei; d jsonb;
begin
  if me is null then raise exception 'Devi fare l''accesso'; end if;
  select * into t from public.tornei where stato = 'iscrizioni' order by id desc limit 1;
  if t.id is null then raise exception 'Le iscrizioni sono chiuse'; end if;
  if si then
    select dati into d from public.salvataggi where user_id = me and slot = 'partita';
    if d is null then raise exception 'Prima gioca almeno una partita'; end if;
    insert into public.tornei_iscritti (torneo, user_id, nome, avatar)
      values (t.id, me, left(coalesce(nullif(d->'profilo'->>'nome', ''), 'Giocatore'), 22),
        case when coalesce((d->'carte'->>(d->'profilo'->>'avatar'))::int, 0) > 0 then d->'profilo'->>'avatar' else '' end)
      on conflict (torneo, user_id) do nothing;
  else
    delete from public.tornei_iscritti where torneo = t.id and user_id = me;
  end if;
  return jsonb_build_object('iscritti', (select count(*) from public.tornei_iscritti where torneo = t.id));
end $$;

-- passa al turno dopo quando tutte le partite del turno sono chiuse; alla fine dà i premi
create or replace function public.torneo_avanza(tid bigint) returns void
language plpgsql security definer set search_path = public as $$
declare t public.tornei; r int; aperte int; vinc uuid[]; pers uuid[]; i int; ore int; pos int; u uuid;
begin
  select * into t from public.tornei where id = tid for update;
  if t.stato <> 'in_corso' then return; end if;
  ore := t.ore_turno;
  -- i passaggi del turno (avversario mancante) si chiudono da soli
  update public.tornei_partite set vincitore = coalesce(a, b), chiusa = now()
    where torneo = tid and vincitore is null and (a is null or b is null) and coalesce(a, b) is not null;
  select max(turno) into r from public.tornei_partite where torneo = tid;
  select count(*) into aperte from public.tornei_partite where torneo = tid and turno = r and vincitore is null;
  if aperte > 0 then return; end if;
  select array_agg(vincitore order by n) into vinc from public.tornei_partite where torneo = tid and turno = r and not finalina;
  if coalesce(array_length(vinc, 1), 0) <= 1 then
    -- finale (e finalina) giocate: premi ai primi tre
    update public.tornei set stato = 'finito', finito = now() where id = tid;
    for pos in 1..3 loop
      u := case pos
        when 1 then (select vincitore from public.tornei_partite where torneo = tid and turno = r and not finalina)
        when 2 then (select case when vincitore = a then b else a end from public.tornei_partite where torneo = tid and turno = r and not finalina)
        else (select vincitore from public.tornei_partite where torneo = tid and turno = r and finalina) end;
      if u is not null and t.premi -> (pos - 1) is not null then
        insert into public.premi_classifica (user_id, posizione, titolo, punti, premio, tipo) values (u, pos, t.nome, 0, t.premi -> (pos - 1), 'torneo');
      end if;
    end loop;
    return;
  end if;
  -- turno dopo: i vincitori a coppie (1-2, 3-4, …)
  for i in 1..(array_length(vinc, 1) / 2) loop
    insert into public.tornei_partite (torneo, turno, n, a, b, scadenza) values (tid, r + 1, i, vinc[2 * i - 1], vinc[2 * i], now() + make_interval(hours => ore));
  end loop;
  -- se questo era il turno delle semifinali (2 vincitori), si gioca anche la finalina tra chi ha perso
  if array_length(vinc, 1) = 2 then
    select array_agg(case when vincitore = a then b else a end order by n) into pers from public.tornei_partite where torneo = tid and turno = r and not finalina;
    if pers[1] is not null and pers[2] is not null then
      insert into public.tornei_partite (torneo, turno, n, finalina, a, b, scadenza) values (tid, r + 1, 1, true, pers[1], pers[2], now() + make_interval(hours => ore));
    end if;
  end if;
  perform public.torneo_avanza(tid);   -- se nel turno nuovo ci sono passaggi automatici
end $$;
revoke all on function public.torneo_avanza(bigint) from public, anon, authenticated;

create or replace function public.avvia_torneo() returns jsonb
language plpgsql security definer set search_path = public as $$
declare t public.tornei; ids uuid[]; n int; dim int := 2; i int;
begin
  if not public.sono_admin() then raise exception 'Solo l''admin può avviare il torneo'; end if;
  select * into t from public.tornei where stato = 'iscrizioni' order by id desc limit 1 for update;
  if t.id is null then raise exception 'Nessun torneo con le iscrizioni aperte'; end if;
  select array_agg(user_id order by random()) into ids from public.tornei_iscritti where torneo = t.id;
  n := coalesce(array_length(ids, 1), 0);
  if n < 3 then raise exception 'Servono almeno 3 iscritti'; end if;
  while dim < n loop dim := dim * 2; end loop;
  update public.tornei set stato = 'in_corso', iniziato = now() where id = t.id;
  -- tabellone: i passaggi del turno vanno ai primi (un giocatore contro "nessuno")
  for i in 1..(dim / 2) loop
    insert into public.tornei_partite (torneo, turno, n, a, b, scadenza)
      values (t.id, 1, i, ids[i], case when i + dim / 2 <= n then ids[i + dim / 2] end, now() + make_interval(hours => t.ore_turno));
  end loop;
  perform public.torneo_avanza(t.id);
  return jsonb_build_object('iscritti', n, 'tabellone', dim);
end $$;

-- risultato di una sfida dal vivo: se era una partita del torneo ancora da giocare, la chiude
create or replace function public.torneo_esito(x uuid, y uuid, v uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m public.tornei_partite;
begin
  select pp.* into m from public.tornei_partite pp join public.tornei t on t.id = pp.torneo
    where t.stato = 'in_corso' and pp.vincitore is null and ((pp.a = x and pp.b = y) or (pp.a = y and pp.b = x))
    order by pp.id desc limit 1 for update;
  if m.id is null or (v <> x and v <> y) then return; end if;
  update public.tornei_partite set vincitore = v, chiusa = now() where id = m.id;
  perform public.torneo_avanza(m.torneo);
end $$;
revoke all on function public.torneo_esito(uuid, uuid, uuid) from public, anon, authenticated;

-- l'admin assegna una partita non giocata (vittoria a tavolino) oppure annulla il torneo
create or replace function public.assegna_torneo(partita bigint, vincitore uuid) returns void
language plpgsql security definer set search_path = public as $$
declare m public.tornei_partite;
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  select * into m from public.tornei_partite where id = partita for update;
  if m.id is null or m.vincitore is not null then raise exception 'Partita già chiusa'; end if;
  if vincitore <> m.a and vincitore <> m.b then raise exception 'Vincitore non valido'; end if;
  update public.tornei_partite set vincitore = assegna_torneo.vincitore, chiusa = now(), a_tavolino = true where id = partita;
  perform public.torneo_avanza(m.torneo);
end $$;
create or replace function public.annulla_torneo() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  update public.tornei set stato = 'annullato', finito = now() where stato in ('iscrizioni', 'in_corso');
end $$;
revoke all on function public.crea_torneo(text, integer, jsonb) from public, anon;
grant execute on function public.crea_torneo(text, integer, jsonb) to authenticated;
revoke all on function public.iscriviti_torneo(boolean) from public, anon;
grant execute on function public.iscriviti_torneo(boolean) to authenticated;
revoke all on function public.avvia_torneo() from public, anon;
grant execute on function public.avvia_torneo() to authenticated;
revoke all on function public.assegna_torneo(bigint, uuid) from public, anon;
grant execute on function public.assegna_torneo(bigint, uuid) to authenticated;
revoke all on function public.annulla_torneo() from public, anon;
grant execute on function public.annulla_torneo() to authenticated;

-- ---------------- Statistiche delle carte (le vede solo l'admin) ----------------
-- A fine battaglia il gioco manda le carte scese in campo e se ha vinto. Servono per bilanciare:
-- una carta usata tantissimo che vince il 70% delle volte è da indebolire.
create table if not exists public.stat_carte (
  carta text not null,
  modo  text not null check (modo in ('pc', 'vivo')),
  usate integer not null default 0,
  vinte integer not null default 0,
  primary key (carta, modo)
);
alter table public.stat_carte enable row level security;
revoke all on public.stat_carte from anon, authenticated;
-- per non far gonfiare i numeri: una battaglia ogni 20 secondi e al massimo 150 al giorno per giocatore
create table if not exists public.stat_limite (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ultimo  timestamptz not null default now(),
  giorno  date,
  oggi    integer not null default 0
);
alter table public.stat_limite enable row level security;
revoke all on public.stat_limite from anon, authenticated;

create or replace function public.registra_carte(carte text[], vinto boolean, quale text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); l public.stat_limite; g date := (now() at time zone 'Europe/Rome')::date;
begin
  if me is null or quale not in ('pc', 'vivo') or public.sono_admin() then return; end if;
  select * into l from public.stat_limite where user_id = me for update;
  if l.user_id is not null and (l.ultimo > now() - interval '20 seconds' or (l.giorno = g and l.oggi >= 150)) then return; end if;
  insert into public.stat_limite as s (user_id, ultimo, giorno, oggi) values (me, now(), g, 1)
    on conflict (user_id) do update set ultimo = now(), oggi = case when s.giorno = g then s.oggi + 1 else 1 end, giorno = g;
  insert into public.stat_carte as s (carta, modo, usate, vinte)
    select x, quale, 1, case when vinto then 1 else 0 end
    from (select distinct x from unnest(carte[1:5]) as u(x) where public.rarita_carta(x) is not null) t
    on conflict (carta, modo) do update set usate = s.usate + 1, vinte = s.vinte + excluded.vinte;
end $$;

-- per l'admin: battaglie e vittorie di ogni carta, e quanti giocatori ce l'hanno, quanti la usano in squadra, a che livello
create or replace function public.statistiche_carte() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  return jsonb_build_object(
    'giocatori', (select count(*) from public.salvataggi s where s.slot = 'partita'
                   and not exists (select 1 from public.amministratori a where a.user_id = s.user_id)),
    'battaglie', (select coalesce(jsonb_object_agg(carta || ':' || modo, jsonb_build_array(usate, vinte)), '{}'::jsonb) from public.stat_carte),
    'possesso', (select coalesce(jsonb_object_agg(k, jsonb_build_array(n, sq, liv)), '{}'::jsonb) from (
        select e.k, count(*) as n,
          count(*) filter (where coalesce(s.dati->'squadre'->(case when s.dati->>'attiva' ~ '^[0-9]+$' then (s.dati->>'attiva')::int else 0 end)->'carte', '[]'::jsonb) ? e.k) as sq,
          round(avg(case when s.dati->'liv'->>e.k ~ '^[0-9]+$' then least(30, (s.dati->'liv'->>e.k)::int) else 1 end), 1) as liv
        from public.salvataggi s, jsonb_each_text(coalesce(s.dati->'carte', '{}'::jsonb)) as e(k, v)
        where s.slot = 'partita' and e.v ~ '^[0-9]+$' and e.v::int > 0
          and not exists (select 1 from public.amministratori a where a.user_id = s.user_id)
        group by e.k) t));
end $$;
create or replace function public.azzera_statistiche_carte() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sono_admin() then raise exception 'Solo l''admin'; end if;
  delete from public.stat_carte where true;
end $$;
revoke all on function public.registra_carte(text[], boolean, text), public.statistiche_carte(), public.azzera_statistiche_carte() from public, anon;
grant execute on function public.registra_carte(text[], boolean, text), public.statistiche_carte(), public.azzera_statistiche_carte() to authenticated;
