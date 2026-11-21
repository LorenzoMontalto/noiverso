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
  if coalesce((inv->>'normale')::int, 0) > 300 or coalesce((inv->>'epica')::int, 0) > 100 or coalesce((inv->>'leggendaria')::int, 0) > 50 then
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
  new.punti := coalesce((s->'stats'->>'punti')::int, 0);
  new.dati := coalesce(new.dati, '{}'::jsonb) || jsonb_build_object(
    'punti', new.punti,
    'vittorie', coalesce((s->'stats'->>'vittorie')::int, 0),
    'sconfitte', coalesce((s->'stats'->>'sconfitte')::int, 0),
    'carte', (select count(*) from jsonb_object_keys(coalesce(s->'carte', '{}'::jsonb))));
  new.aggiornato := now();
  return new;
end $$;
drop trigger if exists classifica_vera on public.classifica;
create trigger classifica_vera before insert or update on public.classifica
  for each row execute function public.classifica_vera();

-- Fine. Dopo esserti registrato nel gioco, esegui supabase/importa-progressi.sql
-- (porta i tuoi progressi e ti rende admin).
