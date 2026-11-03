import mongoose from "mongoose";

// 開發模式下 hot reload 會重新執行模組，把連線快取在 global 避免重複連線
const globalForMongoose = globalThis as unknown as {
  mongooseConn?: Promise<typeof mongoose>;
};

export function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("缺少環境變數 MONGODB_URI");

  globalForMongoose.mongooseConn ??= mongoose
    .connect(uri, { serverSelectionTimeoutMS: 10_000 })
    .catch((e) => {
      // 連線失敗就清掉快取，下次請求可以重試
      globalForMongoose.mongooseConn = undefined;
      throw e;
    });
  return globalForMongoose.mongooseConn;
}
