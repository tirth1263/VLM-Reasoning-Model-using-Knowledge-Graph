import type { WebContextSource } from "../types";
import { lexicalOverlap, normalizeText, tokenize, unique } from "./text";

type WebContextInput = {
  question: string;
  imageDescription: string;
  objects: string[];
};

type WikipediaSearchResponse = {
  query?: {
    search?: Array<{
      title: string;
      snippet?: string;
    }>;
  };
};

type WikipediaSummaryResponse = {
  title?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
};

const WEB_TIMEOUT_MS = 7000;

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchJson<T>(url: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), WEB_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Web source returned ${response.status}`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function rankTitle(title: string, question: string, imageDescription: string, objects: string[]) {
  const objectText = objects.join(" ");
  return lexicalOverlap(title, `${question} ${imageDescription} ${objectText}`) + lexicalOverlap(title, objectText) * 0.8;
}

function buildQueries({ question, imageDescription, objects }: WebContextInput) {
  const questionTokens = tokenize(question).slice(0, 10).join(" ");
  const visualTokens = tokenize(imageDescription).slice(0, 8).join(" ");
  const objectText = objects.slice(0, 5).join(" ");
  const propertyIntent = tokenize(question)
    .filter((token) => ["break", "brittle", "conduct", "electric", "heat", "float", "sink", "magnet", "shadow", "material", "property"].includes(token))
    .join(" ");

  return unique(
    [
      `${questionTokens} ${objectText}`,
      `${objectText} physical properties ${propertyIntent}`,
      `${visualTokens} ${propertyIntent}`,
      questionTokens,
    ]
      .map((query) => normalizeText(query).replace(/\s+/g, " ").trim())
      .filter((query) => query.length > 3),
  ).slice(0, 3);
}

async function searchWikipedia(query: string) {
  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set("srsearch", query);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("origin", "*");

  const data = await fetchJson<WikipediaSearchResponse>(searchUrl.toString());
  return (data.query?.search ?? []).slice(0, 4).map((item) => ({
    title: item.title,
    snippet: stripHtml(item.snippet ?? ""),
  }));
}

async function summarizeWikipedia(title: string, fallbackSnippet: string, query: string, score: number): Promise<WebContextSource | null> {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summary = await fetchJson<WikipediaSummaryResponse>(summaryUrl);
  const extract = (summary.extract || fallbackSnippet).replace(/\s+/g, " ").trim();
  if (!extract) return null;

  return {
    id: `wikipedia-${normalizeText(summary.title || title).replace(/\s+/g, "-")}`,
    title: summary.title || title,
    url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
    query,
    extract,
    source: "wikipedia",
    score,
  };
}

export async function retrieveWebContext(input: WebContextInput) {
  const queries = buildQueries(input);
  const hits = (
    await Promise.all(
      queries.map(async (query) => {
        try {
          const results = await searchWikipedia(query);
          return results.map((result) => ({ ...result, query }));
        } catch {
          return [];
        }
      }),
    )
  ).flat();

  const seen = new Set<string>();
  const ranked = hits
    .filter((hit) => {
      const key = normalizeText(hit.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((hit) => ({
      ...hit,
      score: rankTitle(`${hit.title} ${hit.snippet}`, input.question, input.imageDescription, input.objects),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const summaries = await Promise.all(
    ranked.map(async (hit) => {
      try {
        return await summarizeWikipedia(hit.title, hit.snippet, hit.query, hit.score);
      } catch {
        return null;
      }
    }),
  );

  return summaries.filter((source): source is WebContextSource => Boolean(source)).slice(0, 4);
}

export function generateContextQuestions(question: string, objects: string[], webContext: WebContextSource[]) {
  const primaryObject = objects[0] || "the main object";
  const sourceTitle = webContext[0]?.title || "the retrieved context";

  return unique([
    `Which physical properties of ${primaryObject} are most relevant to this question?`,
    `What visible evidence in the image supports or contradicts the answer?`,
    `What does ${sourceTitle} add beyond the local knowledge graph?`,
    `Which object-property relation should be checked before answering: material, force, motion, heat, or light?`,
    `How would the answer change if the image context or material identification were different?`,
    `Can the answer be justified with both visual grounding and retrieved web evidence?`,
    `Question being answered: ${question}`,
  ]).slice(0, 6);
}
