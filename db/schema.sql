-- Neon Postgres schema (step 1 of execution plan). Not used yet — app runs on lib/mock.js.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE households (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE family_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid REFERENCES households, name text, role text, birth_date date);
CREATE TABLE accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid REFERENCES households, provider text, name text, type text CHECK (type IN ('bank','credit','investment','loan','asset')), balance numeric(14,2), executor_connection_id text, updated_at timestamptz DEFAULT now());
CREATE TABLE budgets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid REFERENCES households, category text, monthly_limit numeric(12,2));
CREATE TABLE bills (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid REFERENCES households, payee text, amount numeric(12,2), due_date date, status text CHECK (status IN ('received','scheduled','approval','paid','anomaly')), source text, raw_email_id text, created_at timestamptz DEFAULT now());
CREATE TABLE events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid REFERENCES households, member_id uuid REFERENCES family_members, title text, starts_at timestamptz, ends_at timestamptz, tag text);
CREATE TABLE approvals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid REFERENCES households, agent text, kind text, payload jsonb, status text DEFAULT 'pending', decided_at timestamptz);
CREATE TABLE health_metrics (id bigserial PRIMARY KEY, member_id uuid REFERENCES family_members, metric text, value numeric, recorded_at timestamptz);
CREATE TABLE agent_identities (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, agentmail_inbox text UNIQUE, scopes text[]);
CREATE TABLE audit_log (id bigserial PRIMARY KEY, actor text, action text, target text, detail jsonb, at timestamptz DEFAULT now());
CREATE TABLE memories (id bigserial PRIMARY KEY, household_id uuid REFERENCES households, content text, embedding vector(1536), created_at timestamptz DEFAULT now());
CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops);
