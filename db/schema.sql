-- OmniControl schema for Neon Postgres. Applied by: npm run db:setup
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS family_members (id serial PRIMARY KEY, name text NOT NULL, role text, color text);
CREATE TABLE IF NOT EXISTS accounts (id serial PRIMARY KEY, name text NOT NULL, type text NOT NULL CHECK (type IN ('bank','credit','investment','loan','asset')), balance numeric(14,2) NOT NULL DEFAULT 0, updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS net_worth_history (month date PRIMARY KEY, value numeric(14,2) NOT NULL);
CREATE TABLE IF NOT EXISTS budgets (category text PRIMARY KEY, spent numeric(12,2) NOT NULL DEFAULT 0, monthly_limit numeric(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS bills (id text PRIMARY KEY, payee text NOT NULL, amount numeric(12,2) NOT NULL, due_date date NOT NULL, status text NOT NULL CHECK (status IN ('received','scheduled','approval','paid','anomaly')), note text, source text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS events (id serial PRIMARY KEY, title text NOT NULL, who text, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, calendar text, color text, conflict boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS todos (id serial PRIMARY KEY, text text NOT NULL, tag text DEFAULT 'Inbox', done boolean NOT NULL DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS tasks (id serial PRIMARY KEY, title text NOT NULL, due_date date NOT NULL, priority text CHECK (priority IN ('high','medium','low')), area text, done boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS approvals (id text PRIMARY KEY, kind text, title text NOT NULL, agent text, reason text, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')), decided_at timestamptz);
CREATE TABLE IF NOT EXISTS health_metrics (id serial PRIMARY KEY, metric text NOT NULL, value numeric NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS agent_identities (name text PRIMARY KEY, inbox text UNIQUE, runtime text, status text, task text);
CREATE TABLE IF NOT EXISTS interests (topic text PRIMARY KEY, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_log (id bigserial PRIMARY KEY, actor text NOT NULL, action text NOT NULL, target text, detail jsonb, at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS memories (id bigserial PRIMARY KEY, content text NOT NULL, embedding vector(1536), created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING hnsw (embedding vector_cosine_ops);

-- Agent harness: learned integrations + single-use approvals
CREATE TABLE IF NOT EXISTS custom_integrations (id text PRIMARY KEY, name text NOT NULL, kind text NOT NULL CHECK (kind IN ('http','mcp')), spec jsonb NOT NULL, docs_url text, status text NOT NULL DEFAULT 'draft', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
