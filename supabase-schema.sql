-- ============================================
-- DOLPHIN BUYBACK - SUPABASE SCHEMA
-- ============================================
-- Esegui questo SQL nella console Supabase:
-- Dashboard → SQL Editor → New Query → Incolla → Run

-- Tabella buybacks (storico transazioni)
CREATE TABLE IF NOT EXISTS buybacks (
  id BIGSERIAL PRIMARY KEY,
  signature TEXT NOT NULL UNIQUE,
  amount DECIMAL(20, 9) NOT NULL,
  token_amount TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella stats (statistiche aggregate)
CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_volume DECIMAL(20, 9) DEFAULT 0,
  total_buys INTEGER DEFAULT 0,
  last_buy_amount DECIMAL(20, 9) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserisci record iniziale stats
INSERT INTO stats (id, total_volume, total_buys, last_buy_amount)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Indice per query veloci
CREATE INDEX IF NOT EXISTS idx_buybacks_created_at ON buybacks(created_at DESC);

-- Abilita Row Level Security (RLS)
ALTER TABLE buybacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica (chiunque può vedere i buyback)
CREATE POLICY "Public read access" ON buybacks
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON stats
  FOR SELECT USING (true);

-- Policy per scrittura (solo con service key)
CREATE POLICY "Service write access" ON buybacks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service write access" ON stats
  FOR ALL USING (true);

-- ============================================
-- FATTO! Le tabelle sono pronte.
-- ============================================
