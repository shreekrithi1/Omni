import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import path from "node:path";
import { byId } from "./connectors";

// Encrypted secret store (AES-256-GCM). Tokens are encrypted at rest and NEVER returned to the browser.
// Key: OMNI_ENCRYPTION_KEY (recommended; use a KMS/secret manager in production) or an auto-generated local key file.
const DIR = path.join(process.cwd(), ".omni");
const FILE = path.join(DIR, "secrets.json");
const SETTINGS = path.join(DIR, "settings.json");
const KEYFILE = path.join(DIR, "master.key");

function ensureDir() { if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true, mode: 0o700 }); }
function key() {
  if (process.env.OMNI_ENCRYPTION_KEY) return createHash("sha256").update(process.env.OMNI_ENCRYPTION_KEY).digest();
  ensureDir();
  if (!existsSync(KEYFILE)) { writeFileSync(KEYFILE, randomBytes(32).toString("base64"), { mode: 0o600 }); }
  return Buffer.from(readFileSync(KEYFILE, "utf8"), "base64");
}
const readJson = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return {}; } };
const writeJson = (f, v) => { ensureDir(); writeFileSync(f, JSON.stringify(v, null, 2), { mode: 0o600 }); try { chmodSync(f, 0o600); } catch {} };

function encrypt(text) {
  const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}
function decrypt(blob) {
  const [iv, tag, data] = blob.split(".").map((s) => Buffer.from(s, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

export function saveSecret(id, value, extra = {}) {
  const all = readJson(FILE);
  all[id] = { value: encrypt(value), last4: value.slice(-4), savedAt: new Date().toISOString(), ...(extra.url ? { url: extra.url } : {}), ...(extra.personaId ? { personaId: extra.personaId } : {}), test: null };
  writeJson(FILE, all);
}
export function deleteSecret(id) { const all = readJson(FILE); delete all[id]; writeJson(FILE, all); }
export function recordTest(id, result) { const all = readJson(FILE); if (all[id]) { all[id].test = { ...result, at: new Date().toISOString() }; writeJson(FILE, all); } }

// Resolve a credential: Settings first, then environment variable.
export function getSecret(id) {
  const rec = readJson(FILE)[id];
  if (rec?.value) { try { return decrypt(rec.value); } catch { /* key changed */ } }
  const c = byId(id); return c?.env ? process.env[c.env] || null : null;
}
export function getPersonaId(id) { const rec = readJson(FILE)[id]; const c = byId(id); return rec?.personaId || (c?.idEnv ? process.env[c.idEnv] : null) || null; }
export function setPersonaId(id, personaId) { const all = readJson(FILE); if (!all[id]) return false; all[id].personaId = personaId; writeJson(FILE, all); return true; }
export function getUrl(id) { const rec = readJson(FILE)[id]; const c = byId(id); return rec?.url || (c?.urlEnv ? process.env[c.urlEnv] : null) || null; }

// Safe, non-secret status for the UI.
export function status(id) {
  const rec = readJson(FILE)[id]; const c = byId(id);
  if (rec?.value) return { configured: true, source: "saved", last4: rec.last4, savedAt: rec.savedAt, url: rec.url || null, personaId: rec.personaId || (c?.idEnv ? process.env[c.idEnv] : null) || null, test: rec.test };
  if (c?.env && process.env[c.env]) return { configured: true, source: "env", last4: process.env[c.env].slice(-4), url: c.urlEnv ? process.env[c.urlEnv] || null : null, personaId: c.idEnv ? process.env[c.idEnv] || null : null, test: null };
  return { configured: false, source: null, url: null, personaId: null, test: null };
}

export const getSettings = () => ({ mastraUrl: process.env.MASTRA_URL || "", agentId: "olivia", useLive: false, displayName: "Olivia", ...readJson(SETTINGS) });
export const saveSettings = (s) => writeJson(SETTINGS, { ...getSettings(), ...s });
