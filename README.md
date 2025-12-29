# 🐬 Dolphin Buyback Dashboard

Dashboard per monitorare i buyback automatici del token tramite Jupiter.

**Architettura:**
- 🌐 **Sito** → Vercel (visualizza i dati)
- 💻 **Script** → Tuo Mac (esegue i buyback)
- 🗄️ **Database** → Supabase (sincronizza tutto)

---

## 🚀 Setup Completo

### Step 1: Crea progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → **Start your project**
2. Crea un account (gratis)
3. **New Project** → Scegli nome e password
4. Aspetta che il progetto sia pronto (~2 minuti)

### Step 2: Crea le tabelle

1. Nel dashboard Supabase, vai su **SQL Editor** (icona nel menu a sinistra)
2. Clicca **New Query**
3. Copia e incolla tutto il contenuto di `supabase-schema.sql`
4. Clicca **Run** (o Cmd+Enter)
5. Dovresti vedere "Success. No rows returned"

### Step 3: Prendi le API Keys

1. Vai su **Settings** → **API** (nel menu a sinistra)
2. Copia questi valori:
   - `Project URL` → sarà il tuo `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → sarà il tuo `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → sarà il tuo `SUPABASE_SERVICE_KEY` (⚠️ tienila segreta!)

### Step 4: Configura il progetto

```bash
# Estrai il progetto
unzip dolphin-buyback.zip
cd dolphin-buyback

# Installa dipendenze
npm install

# Crea il file .env
cp .env.example .env
```

Modifica `.env` con i tuoi valori:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tuoprogetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Wallet (vedi sotto come ottenere le chiavi)
DEV_WALLET_PRIVATE_KEY=[1,2,3,...]
BUYBACK_WALLET_PRIVATE_KEY=[1,2,3,...]

# Opzionale
RPC_URL=https://api.mainnet-beta.solana.com
MIN_SOL_THRESHOLD=0.5
```

### Step 5: Converti la Private Key di Phantom

La private key di Phantom è in formato base58, ma serve in formato JSON array.

```bash
# Installa bs58
npm install bs58

# Crea un file convert.js
echo "const bs58 = require('bs58'); console.log(JSON.stringify(Array.from(bs58.decode(process.argv[2]))));" > convert.js

# Esegui (sostituisci con la tua key)
node convert.js "TUA_PRIVATE_KEY_BASE58"
```

Copia l'output (es. `[123,45,67,...]`) nel file `.env`.

### Step 6: Testa lo script

```bash
npm run buyback
```

Dovresti vedere:
```
[...] 🐬 DOLPHIN BUYBACK - Starting...
[...] 📍 Dev Wallet: xxx...
[...] 💰 Dev wallet balance: 0.1234 SOL
[...] ⏳ Balance sotto soglia (0.5 SOL). Nessun buyback.
```

### Step 7: Deploy sito su Vercel

1. Crea un repo GitHub e pusha il codice:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TUO_USER/dolphin-buyback.git
git push -u origin main
```

2. Vai su [vercel.com](https://vercel.com) → **Add New Project**
3. Importa da GitHub
4. **Environment Variables** → Aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy**

### Step 8: Automatizza i buyback (ogni 20 min)

Su Mac, apri il terminale:

```bash
crontab -e
```

Aggiungi questa riga (modifica il path):

```
*/20 * * * * cd /Users/TUOUSER/dolphin-buyback && /usr/local/bin/npm run buyback >> /Users/TUOUSER/dolphin-buyback/logs.txt 2>&1
```

Salva ed esci (`:wq` se usi vim).

Verifica che sia attivo:
```bash
crontab -l
```

---

## 📁 Struttura Progetto

```
dolphin-buyback/
├── app/
│   ├── api/stats/route.js   # API lettura da Supabase
│   ├── globals.css          # Stili cyberpunk
│   ├── layout.jsx           # Layout
│   └── page.jsx             # Dashboard
├── lib/
│   └── supabase.js          # Client Supabase
├── scripts/
│   └── buyback.mjs          # ⭐ Script da eseguire sul Mac
├── supabase-schema.sql      # SQL per creare le tabelle
├── .env.example
└── package.json
```

---

## 🔧 Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia sito in locale (http://localhost:3000) |
| `npm run buyback` | Esegue un buyback manualmente |
| `npm run build` | Build per produzione |

---

## 🔐 Sicurezza

- ❌ **MAI** committare `.env` su Git (è già nel `.gitignore`)
- ❌ **MAI** condividere `SUPABASE_SERVICE_KEY`
- ❌ **MAI** condividere le private key dei wallet
- ✅ Usa wallet dedicati solo per questo bot
- ✅ Inizia con piccole somme per testare

---

## 🛠️ Troubleshooting

**"Supabase credentials not configured"**
→ Controlla che `.env` abbia tutti i valori Supabase

**"Error parsing private keys"**
→ Le chiavi devono essere in formato `[1,2,3,...]` non base58

**"Balance sotto soglia"**
→ Il wallet dev ha meno di 0.5 SOL

**"Jupiter quote failed"**
→ Il token potrebbe non essere più su Jupiter o pool vuota

**Il cron non funziona**
→ Verifica il path assoluto nel crontab e che npm sia accessibile

---

## 📊 Monitoraggio

- **Dashboard**: Il tuo sito Vercel
- **Transazioni**: [solscan.io](https://solscan.io)
- **Database**: Supabase Dashboard → Table Editor
- **Logs script**: `cat logs.txt` nella cartella del progetto

---

Made with 🐬 and ⚡
