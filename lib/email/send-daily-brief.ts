import { Resend } from "resend";
import { getDailyBrief, type DailyBrief } from "@/lib/daily/brief";
import { renderDailyBriefEmail } from "./daily-brief-email";

// 寄件人用 Resend 預設寄件人；收件人寫死
// 注意：用 onboarding@resend.dev 時，只能寄給 Resend 帳號本身註冊的信箱
const FROM = "每日晨報 <onboarding@resend.dev>";
const TO = "kevin2android@gmail.com";

/** 寄出晨報；沒傳 brief 就重新產生一份 */
export async function sendDailyBriefEmail(brief?: DailyBrief) {
  const { subject, html } = renderDailyBriefEmail(brief ?? (await getDailyBrief()));

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject,
    html,
  });
  if (error) throw new Error(error.message);

  return { id: data?.id, to: TO };
}
