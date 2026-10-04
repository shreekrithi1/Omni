// Small fetch helper: clear error when an integration's key is missing.
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it to the Mastra project's environment variables.`);
  return v;
}
export async function callJson(url: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}
