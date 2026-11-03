import mongoose, { Schema, type InferSchemaType } from "mongoose";

const WeatherSchema = new Schema(
  {
    location: String,
    date: String,
    description: String,
    currentTemp: Number,
    maxTemp: Number,
    minTemp: Number,
    rainChance: Number,
  },
  { _id: false },
);

const IndexQuoteSchema = new Schema(
  {
    symbol: String,
    name: String,
    date: String,
    close: Number,
    previousClose: Number,
    change: Number,
    changePercent: Number,
  },
  { _id: false },
);

const NewsItemSchema = new Schema(
  {
    title: String,
    link: String,
    publishedAt: String,
    summary: String,
  },
  { _id: false },
);

const SummarySchema = new Schema(
  {
    weatherSummary: String,
    newsSummary: [String],
    encouragement: String,
  },
  { _id: false },
);

const DailyBriefSchema = new Schema(
  {
    date: { type: String, required: true, index: true }, // 台灣時間 YYYY-MM-DD
    weather: { type: WeatherSchema, default: null },
    markets: { type: [IndexQuoteSchema], default: null },
    news: { type: [NewsItemSchema], default: null },
    summary: { type: SummarySchema, default: null },
    // 各資料來源的錯誤訊息（"errors" 是 mongoose 保留字，所以改名）
    fetchErrors: { type: Schema.Types.Mixed, default: undefined },
  },
  {
    timestamps: true, // 自動加上 createdAt / updatedAt
    collection: "daily_briefs",
  },
);

export type DailyBriefDoc = InferSchemaType<typeof DailyBriefSchema>;

// 避免 hot reload 時重複註冊 model
export const DailyBriefModel =
  mongoose.models.DailyBrief ??
  mongoose.model("DailyBrief", DailyBriefSchema);
