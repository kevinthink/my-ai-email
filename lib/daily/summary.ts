import OpenAI from "openai";
import type { Weather } from "./weather";
import type { IndexQuote } from "./us-indices";
import type { NewsItem } from "./news";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

export type DailySummary = {
  weatherSummary: string;
  newsSummary: string[];
  encouragement: string;
};

type Input = {
  date: string;
  weather: Weather | null;
  markets: IndexQuote[] | null;
  news: NewsItem[] | null;
};

export async function summarize(input: Input): Promise<DailySummary> {
  const client = new OpenAI(); // 自動讀取 process.env.OPENAI_API_KEY

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "你是一位溫暖、簡潔的每日晨報助理，使用繁體中文回答。",
          "根據使用者提供的資料，回傳 JSON，欄位如下：",
          '- "weatherSummary": 今日天氣重點與穿著／帶傘建議（1-2 句）',
          '- "newsSummary": 字串陣列，挑 3 則最值得注意的科技新聞，每則一句話',
          '- "encouragement": 結合今天的天氣與新聞，寫一段鼓勵我的話（2-3 句）',
          "若某項資料為 null，該欄位請說明資料暫時無法取得，不要編造數字。",
        ].join("\n"),
      },
      { role: "user", content: JSON.stringify(input) },
    ],
  });

  const text = completion.choices[0]?.message.content;
  if (!text) throw new Error("OpenAI 沒有回傳內容");
  return JSON.parse(text) as DailySummary;
}
