import { createHash, timingSafeEqual } from "node:crypto";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

/** 檢查 Authorization: Bearer <CRON_SECRET> */
export function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  // 沒設定 secret 時一律拒絕，避免 API 不小心變成公開
  if (!secret) {
    console.error("CRON_SECRET is not set");
    return false;
  }

  const header = request.headers.get("authorization") ?? "";

  // 先 hash 讓兩邊長度相同，才能用 timingSafeEqual 防止時間差攻擊
  return timingSafeEqual(sha256(header), sha256(`Bearer ${secret}`));
}
