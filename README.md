# Noiverso

Il gioco di carte del gruppo. Si gioca dal browser e si installa come app su iPhone, Android, Windows e Mac.

- **Gioco online:** `https://lorenzomontalto.github.io/noiverso/`
- **Pagina da mandare agli amici:** `https://lorenzomontalto.github.io/noiverso/installa.html`
- **File da scaricare** (.exe, .dmg, .apk): nella pagina *Releases* di questo repository, creati in automatico.

## Com'è fatto

| Cartella | Cosa contiene |
|---|---|
| `sorgente/` | Il gioco (HTML, codice, immagini, icone). Si modifica qui. |
| `sito/` | Il gioco pronto da pubblicare. Si crea con `python3 costruisci.py`. |
| `supabase/` | Il database: `schema.sql` (tabelle e regole di sicurezza) e `importa-progressi.sql`. |
| `desktop/` | L'app per Windows e Mac (Electron): apre il gioco in una finestra sua. |
| `android/` | L'app per Android (Capacitor). |
| `.github/workflows/` | Pubblicazione automatica del sito e creazione delle app. |

Le app per PC e Android aprono sempre il gioco pubblicato: quando aggiorni il gioco, si aggiornano da sole senza reinstallare.

## Messa online (una volta sola)

### 1. Supabase (database e accessi)
1. Vai su [supabase.com](https://supabase.com) → **Start your project** → accedi con GitHub.
2. **New project**: nome `noiverso`, scegli una password per il database (salvala), regione **Central EU (Frankfurt)**, piano **Free**.
3. **Authentication → Sign In / Providers → Email**: lascia attivo, **disattiva "Confirm email"**, salva.
   (Il gioco usa nickname e password: nessuna email viene mai inviata.)
4. **SQL Editor → New query**: incolla tutto `supabase/schema.sql` → **Run**.
5. **Project Settings → API**: copia **Project URL** e **anon public key** e mettili in `sorgente/config.js`.

### 2. GitHub (sito e app)
1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Ogni modifica a `sito/` pubblica il gioco; ogni modifica a `desktop/` o `android/` ricrea le app
   (oppure: **Actions → Crea le app → Run workflow**).

### 3. I tuoi progressi
1. Apri il gioco e registrati con il tuo nickname.
2. In `supabase/importa-progressi.sql` cambia `TUO_NICKNAME` con il tuo nickname → incollalo nello **SQL Editor** → **Run**.
   Porta i tuoi progressi e la configurazione delle carte, e ti rende admin.

## Aggiornare il gioco
1. Modifica i file in `sorgente/`.
2. `python3 costruisci.py` (ricrea `sito/` con i nomi dei file aggiornati).
3. Carica le modifiche su GitHub: dopo un minuto il gioco è aggiornato per tutti (si ricarica da solo).

## Note
- **iPhone:** Apple non permette di installare app da un file. Si installa da Safari → Condividi → *Aggiungi alla schermata Home*: si apre a schermo intero e si aggiorna da solo.
- **Windows e Mac:** le app non sono firmate da un'azienda. La prima volta Windows mostra "Windows ha protetto il PC" (→ *Ulteriori informazioni → Esegui comunque*); il Mac chiede di aprirla con tasto destro → *Apri*.
- **Supabase gratuito** mette in pausa il progetto dopo 7 giorni senza nessun accesso: basta riattivarlo dal pannello (i dati restano).
