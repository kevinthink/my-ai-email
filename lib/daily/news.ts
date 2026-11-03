import Parser from "rss-parser";

// 科技新報（TechNews）RSS
const FEED_URL = "https://technews.tw/feed/";
const MAX_ITEMS = 8;

export type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
};

const parser = new Parser({ timeout: 10_000 });

export async function getTechNews(): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEED_URL);
  return feed.items.slice(0, MAX_ITEMS).map((item) => ({
    title: item.title?.trim() ?? "",
    link: item.link ?? "",
    publishedAt: item.isoDate ?? item.pubDate ?? "",
    summary: (item.contentSnippet ?? "").replace(/\s+/g, " ").slice(0, 200),
  }));
}
