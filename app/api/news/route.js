import { NextResponse } from "next/server";

// Personalized news via Exa (https://exa.ai). Set EXA_API_KEY in .env.local.
export async function POST(req) {
  const { interests = [], days = 7, perTopic = 4 } = await req.json();
  const key = process.env.EXA_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing EXA_API_KEY in .env.local" }, { status: 400 });

  const since = new Date(Date.now() - days * 864e5).toISOString();
  const results = await Promise.all(
    interests.map(async (topic) => {
      try {
        const r = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: { "x-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `latest news about ${topic}`,
            type: "auto",
            category: "news",
            numResults: perTopic,
            startPublishedDate: since,
            contents: { summary: { query: `Summarize why this matters for someone interested in ${topic}, in 1-2 sentences.` } },
          }),
          cache: "no-store",
        });
        if (!r.ok) return { topic, error: `Exa ${r.status}: ${(await r.text()).slice(0, 160)}`, items: [] };
        const data = await r.json();
        return {
          topic,
          items: (data.results || []).map((x) => ({
            title: x.title, url: x.url, date: x.publishedDate, author: x.author,
            summary: x.summary || (x.highlights || []).join(" "),
            source: (() => { try { return new URL(x.url).hostname.replace(/^www\./, ""); } catch { return ""; } })(),
          })),
        };
      } catch (e) {
        return { topic, error: String(e), items: [] };
      }
    })
  );
  return NextResponse.json({ results });
}
