const fetch = require("node-fetch");

/**
 * Pluggable web search used by agents that need live/current information
 * (Government Exam Agent, News & Notification Agent). Tries whichever
 * provider key is configured; if none is set it returns an empty result so
 * callers can fall back to their static seed data instead of crashing.
 *
 * Add more providers here as needed — the important part is that every
 * agent calling `webSearch()` gets back a consistent shape:
 *   [{ title, snippet, link }]
 */
async function webSearch(query, { numResults = 5 } = {}) {
  if (process.env.SERPER_API_KEY) {
    try {
      return await searchWithSerper(query, numResults);
    } catch (err) {
      console.warn(`⚠️ Serper search failed (${query}) — ${err.message}`);
      if (process.env.TAVILY_API_KEY) {
        console.warn("⚠️ Falling back to Tavily search provider.");
        return await searchWithTavily(query, numResults);
      }
      console.warn(
        "⚠️ No fallback search provider configured. webSearch() will return no results and agents will use static seed data."
      );
      return [];
    }
  }

  if (process.env.TAVILY_API_KEY) {
    try {
      return await searchWithTavily(query, numResults);
    } catch (err) {
      console.warn(`⚠️ Tavily search failed (${query}) — ${err.message}`);
      console.warn("⚠️ webSearch() will return no results and agents will use static seed data.");
      return [];
    }
  }

  console.warn(
    `⚠️ No SERPER_API_KEY or TAVILY_API_KEY configured — webSearch("${query}") returning no results. ` +
      "Agents will fall back to static seed data."
  );
  return [];
}

async function searchWithSerper(query, numResults) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: numResults }),
  });
  if (!res.ok) throw new Error(`Serper search failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.organic || []).slice(0, numResults).map((r) => ({
    title: r.title,
    snippet: r.snippet,
    link: r.link,
  }));
}

async function searchWithTavily(query, numResults) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: numResults,
    }),
  });
  if (!res.ok) throw new Error(`Tavily search failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.results || []).slice(0, numResults).map((r) => ({
    title: r.title,
    snippet: r.content,
    link: r.url,
  }));
}

module.exports = { webSearch };
