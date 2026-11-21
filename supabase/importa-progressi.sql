-- ============================================================
--  NOIVERSO — importa i progressi dalla versione su Claude
--  DA ESEGUIRE UNA VOLTA SOLA, DOPO esserti registrato nel gioco.
--  1) Nella riga qui sotto cambia TUO_NICKNAME con il nickname che hai scelto.
--  2) Supabase → SQL Editor → New query → incolla tutto → Run.
-- ============================================================
do $$
declare
  nick text := 'TUO_NICKNAME';
  uid uuid;
begin
  select id into uid from auth.users where email = lower(trim(nick)) || '@giocatori.noiverso.app';
  if uid is null then
    raise exception 'Non trovo il nickname "%": prima registrati nel gioco con quel nickname, poi riesegui.', nick;
  end if;

  -- persone, serie e rarità delle carte decise nell'editor admin
  insert into public.config (id, dati) values ('carte', $NV${"aggiornato": "2026-11-21T10:28:27.422Z", "carte": {"adelrizio": {"rarita": "comune"}, "alessmione": {"rarita": "epica"}, "aphroalessia": {"rarita": "leggendaria"}, "artalice": {"rarita": "comune"}, "aurera": {"rarita": "comune"}, "bandita": {"persona": "Senè", "rarita": "leggendaria"}, "brolymone": {"rarita": "comune"}, "caulifrita": {"rarita": "comune"}, "chapo": {"persona": "Viky"}, "chichice": {"rarita": "leggendaria"}, "comora": {"persona": "Alice"}, "demviky": {"rarita": "leggendaria"}, "diablo": {"persona": "Ludovico", "rarita": "rara"}, "diegkeye": {"rarita": "epica"}, "diego17": {"rarita": "comune"}, "elcuervo": {"persona": "Pips", "rarita": "comune"}, "ellobo": {"persona": "Tiziano", "rarita": "comune"}, "eltigre": {"persona": "Maurizio"}, "fiesta": {"persona": "Samuele"}, "fuego": {"persona": "Alice", "rarita": "epica"}, "giulmai": {"rarita": "leggendaria"}, "gohanlollo": {"rarita": "comune"}, "gossip": {"persona": "Giulia"}, "ironlus": {"persona": "Lorenzo", "rarita": "rara"}, "labruja": {"persona": "Aurora", "rarita": "epica"}, "lasombra": {"persona": "Giulia"}, "ligulk": {"persona": "Simone", "rarita": "epica"}, "loca": {"persona": "Rita"}, "lollon": {"rarita": "epica"}, "mauthor": {"persona": "Maurizio"}, "mieloki": {"persona": "Samuele"}, "ombra": {"persona": "Diego"}, "panky": {"rarita": "epica"}, "pelado": {"persona": "Simone", "rarita": "rara"}, "persene": {"rarita": "epica"}, "pipverus": {"rarita": "leggendaria"}, "poseludovico": {"rarita": "comune"}, "reina": {"persona": "Alessia", "rarita": "epica"}, "rojo": {"persona": "Lorenzo", "rarita": "leggendaria"}, "solmone": {"rarita": "leggendaria"}, "spidertoto": {"persona": "Ludovico", "rarita": "leggendaria"}, "stellascura": {"persona": "Senè"}, "undercut": {"persona": "Tiziano", "rarita": "leggendaria"}, "vedovagreca": {"persona": "Aurora", "rarita": "leggendaria"}, "vegerizio": {"rarita": "rara"}, "vidalessia": {"rarita": "epica"}, "vikatrix": {"rarita": "rara"}, "wandessia": {"rarita": "rara"}, "waspy": {"persona": "Viky", "rarita": "comune"}, "zeutiz": {"rarita": "epica"}}}$NV$::jsonb)
    on conflict (id) do update set dati = excluded.dati, aggiornato = now();

  -- il tuo profilo normale (30 carte, monete, pass, storia, squadre)
  insert into public.salvataggi (user_id, slot, dati) values (uid, 'partita', $NV${"admin": false, "adminPronto": false, "attiva": 0, "carte": {"artalice": 2, "auroruna": 1, "bandita": 2, "brolymone": 1, "caulifrita": 1, "chapo": 2, "comora": 2, "criliziano": 2, "cypips": 2, "diablo": 1, "diego17": 2, "efesamuele": 1, "fiesta": 1, "freezovico": 1, "fuego": 2, "ginice": 1, "gossip": 1, "ironlus": 2, "lasombra": 1, "ludraco": 1, "mieloki": 2, "pelado": 1, "poseludovico": 1, "rojo": 2, "stellascura": 2, "tizievil": 1, "undercut": 2, "vedovagreca": 3, "vegerizio": 1, "wonderrita": 3}, "esp": {"bandita": 150, "chapo": 150, "comora": 0, "cypips": 150, "diablo": 0, "fiesta": 0, "fuego": 150, "mieloki": 0, "pelado": 0, "rojo": 150, "stellascura": 0, "undercut": 150, "vedovagreca": 390, "wonderrita": 390}, "impostazioni": {"consigli": true, "effetti": true, "grafica": "alta", "modalita": "classica", "velocita": "normale"}, "inventario": {"benvenuto": 0, "epica": 0, "leggendaria": 0, "normale": 0}, "liv": {"artalice": 1, "auroruna": 1, "bandita": 4, "brolymone": 1, "caulifrita": 1, "chapo": 4, "comora": 1, "criliziano": 1, "cypips": 4, "diablo": 1, "diego17": 1, "efesamuele": 1, "fiesta": 1, "freezovico": 1, "fuego": 4, "ginice": 1, "gossip": 1, "ironlus": 4, "lasombra": 1, "ludraco": 1, "mieloki": 1, "pelado": 1, "poseludovico": 1, "rojo": 4, "stellascura": 1, "tizievil": 1, "undercut": 4, "vedovagreca": 7, "vegerizio": 1, "wonderrita": 7}, "lodeXp": {}, "monete": 144, "pass": {"bonus": 0, "potInSospeso": 0, "riscossi": [1, 2], "scelte": {}, "xp": 552}, "pot": {"artalice": 10, "comora": 24, "criliziano": 12, "cypips": 10, "diego17": 10, "fuego": 30, "ironlus": 1, "mieloki": 30, "stellascura": 20, "wonderrita": 12}, "profilo": {"avatar": "rojo", "nome": "Lorenzo"}, "rev": 28, "squadre": [{"carte": ["vedovagreca", "mieloki", "bandita", "undercut", "freezovico"], "nome": "Squadra 1"}, {"carte": [], "nome": "Squadra 2"}, {"carte": [], "nome": "Squadra 3"}], "stats": {"bustine": 14, "punti": 8, "sconfitte": 2, "vittorie": 6}, "storia": {"scrigni": [], "stelle": {"c1-1": 2, "c1-2": 2, "c1-3": 1}, "visti": ["c1-1", "c1-2", "c1-3", "c1-4"]}, "ultimoGiorno": "2026-11-21", "v": 2}$NV$::jsonb)
    on conflict (user_id, slot) do update set dati = excluded.dati, aggiornato = now();

  -- diventi admin (monete infinite, tutte le carte, editor delle carte)
  insert into public.amministratori (user_id) values (uid) on conflict do nothing;

  raise notice 'Fatto: progressi importati e % è admin.', nick;
end $$;
