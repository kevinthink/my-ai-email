import { getTodayWeather, type Weather } from "./weather";
import { getUsIndices, type IndexQuote } from "./us-indices";
import { getTechNews, type NewsItem } from "./news";
import { summarize, type DailySummary } from "./summary";
import { connectDB } from "@/lib/db/mongoose";
import { DailyBriefModel } from "@/lib/db/models/daily-brief";

export type DailyBrief = {
  id?: string; // MongoDB 文件 _id
  date: string;
  weather: Weather | null;
  markets: IndexQuote[] | null;
  news: NewsItem[] | null;
  summary: DailySummary | null;
  errors?: Record<string, string>;
};

// 台灣時間的今天 YYYY-MM-DD
const todayInTaipei = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(
    new Date(),
  );

const errorMessage = (r: PromiseSettledResult<unknown>) =>
  r.status === "rejected" ? String(r.reason?.message ?? r.reason) : null;

export async function getDailyBrief(): Promise<DailyBrief> {
  const date = todayInTaipei();

  // 三個資料來源同時抓，其中一個失敗不影響其他
  const [weatherR, marketsR, newsR] = await Promise.allSettled([
    getTodayWeather(),
    getUsIndices(),
    getTechNews(),
  ]);

  const weather = weatherR.status === "fulfilled" ? weatherR.value : null;
  const markets = marketsR.status === "fulfilled" ? marketsR.value : null;
  const news = newsR.status === "fulfilled" ? newsR.value : null;

  const errors: Record<string, string> = {};
  for (const [key, r] of Object.entries({
    weather: weatherR,
    markets: marketsR,
    news: newsR,
  })) {
    const msg = errorMessage(r);
    if (msg) errors[key] = msg;
  }

  let summary: DailySummary | null = null;
  try {
    summary = await summarize({ date, weather, markets, news });
  } catch (e) {
    errors.summary = e instanceof Error ? e.message : String(e);
  }

  // 存到 MongoDB；存檔失敗不影響回傳，只記在 errors.db
  let id: string | undefined;
  try {
    await connectDB();
    const doc = await DailyBriefModel.create({
      date,
      weather,
      markets,
      news,
      summary,
      fetchErrors: Object.keys(errors).length > 0 ? { ...errors } : undefined,
    });
    id = String(doc._id);
  } catch (e) {
    errors.db = e instanceof Error ? e.message : String(e);
  }

  return {
    id,
    date,
    weather,
    markets,
    news,
    summary,
    ...(Object.keys(errors).length > 0 && { errors }),
  };
}
