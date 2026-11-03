import { after, connection } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { sendDailyBriefEmail } from "@/lib/email/send-daily-brief";

// 背景工作（抓資料 + OpenAI + MongoDB + 寄信）可執行的最長秒數。
// 回應會立刻送出，但部署平台仍以此限制整個函式（含 after）的執行時間。
export const maxDuration = 60;

// 給 cron-job.org 排程呼叫：
//   GET /api/send-email
//   Header: Authorization: Bearer <CRON_SECRET>
// 驗證通過後立刻回 202，產生晨報並寄信的工作交給 after() 在背景執行，
// 避免超過 cron-job.org 的 30 秒逾時。
export async function GET(request: Request) {
  // 等真正的請求進來才執行，避免 build 時被預先執行而寄出信
  await connection();

  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();

  after(async () => {
    try {
      const result = await sendDailyBriefEmail();
      console.log("[send-email] 寄信成功", { startedAt, ...result });
    } catch (error) {
      // 背景執行的錯誤不會回傳給 cron-job.org，只能從伺服器 log 查看
      console.error("[send-email] 寄信失敗", { startedAt, error });
    }
  });

  return Response.json(
    { ok: true, message: "已排入背景寄送", startedAt },
    { status: 202 },
  );
}
