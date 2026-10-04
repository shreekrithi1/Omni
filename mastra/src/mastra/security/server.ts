import { timingSafeEqual, createHash, randomUUID } from "node:crypto";

// ---- Edge protection for the Mastra HTTP API (bot / abuse / auth) -----------------------
// Runs on every request in `mastra dev`, `mastra build` and Mastra Cloud (Hono middleware).
const RATE = Number(process.env.OMNI_RATE_LIMIT_PER_MIN || 60);
const BURST_BAN_MIN = 10;
const MAX_BODY = Number(process.env.OMNI_MAX_BODY_BYTES || 64 * 1024);
const buckets = new Map<string, { tokens: number; ts: number; strikes: number; bannedUntil: number }>();
const BAD_UA = /(sqlmap|nikto|nmap|masscan|zgrab|python-requests\/[01]\.|curl\/[0-6]\.|go-http-client\/1\.1$|headlesschrome|phantomjs)/i;

const sha = (s: string) => createHash("sha256").update(s).digest();
function tokenOk(header?: string | null) {
  const expected = process.env.OMNI_API_TOKEN;
  if (!expected) return process.env.NODE_ENV !== "production"; // fail closed in production
  const got = header?.replace(/^Bearer\s+/i, "") || "";
  return timingSafeEqual(sha(got), sha(expected));
}
function clientIp(c: any) {
  return (c.req.header("cf-connecting-ip") || c.req.header("fly-client-ip") || c.req.header("x-forwarded-for")?.split(",")[0] || "unknown").trim();
}
function rateLimited(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip) || { tokens: RATE, ts: now, strikes: 0, bannedUntil: 0 };
  if (b.bannedUntil > now) return true;
  b.tokens = Math.min(RATE, b.tokens + ((now - b.ts) / 60000) * RATE); b.ts = now;
  if (b.tokens < 1) { if (++b.strikes >= 20) b.bannedUntil = now + BURST_BAN_MIN * 60000; buckets.set(ip, b); return true; }
  b.tokens -= 1; buckets.set(ip, b);
  if (buckets.size > 50000) buckets.clear(); // memory bound
  return false;
}
const PUBLIC = [/^\/health$/, /^\/api$/];

export const securityMiddleware = async (c: any, next: () => Promise<void>) => {
  const path = new URL(c.req.url).pathname;
  const reqId = randomUUID();
  const ip = clientIp(c);
  const deny = (status: number, error: string) => c.json({ error, requestId: reqId }, status);
  // Security headers on every response, including rejections
  c.header("X-Request-Id", reqId);
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Cache-Control", "no-store");

  if (BAD_UA.test(c.req.header("user-agent") || "")) return deny(403, "Forbidden");
  if (rateLimited(ip)) { c.header("Retry-After", "60"); return deny(429, "Too many requests"); }
  const len = Number(c.req.header("content-length") || 0);
  if (len > MAX_BODY) return deny(413, "Payload too large");
  if (!PUBLIC.some((r) => r.test(path)) && !tokenOk(c.req.header("authorization"))) return deny(401, "Unauthorized");

  const started = Date.now();
  await next();
  for (const [k, v] of Object.entries({ "X-Request-Id": reqId, "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" })) c.res.headers.set(k, v);
  // Structured access log (no bodies, no secrets) for SIEM / SOC 2 evidence
  console.log(JSON.stringify({ t: new Date().toISOString(), reqId, ip: createHash("sha256").update(ip).digest("hex").slice(0, 16), method: c.req.method, path, status: c.res.status, ms: Date.now() - started }));
};

export const corsOptions = {
  origin: (process.env.OMNI_ALLOWED_ORIGINS || "http://localhost:3000").split(",").map((s) => s.trim()),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-mastra-client-type"],
  credentials: false,
};
