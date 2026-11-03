import type { DailyBrief } from "@/lib/daily/brief";

// Email 用 HTML：表格排版 + inline style，相容 Gmail / Outlook 等信箱

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? escapeHtml(url) : "#";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Microsoft JhengHei',sans-serif";

function section(title: string, body: string) {
  return `
  <tr><td style="padding:0 24px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <h2 style="margin:0 0 12px;font-size:17px;color:#18181b;">${title}</h2>
        ${body}
      </td></tr>
    </table>
  </td></tr>`;
}

const note = (text?: string) =>
  text
    ? `<p style="margin:12px 0 0;padding-top:12px;border-top:1px solid #f4f4f5;font-size:14px;line-height:1.6;color:#52525b;">${escapeHtml(text)}</p>`
    : "";

const unavailable = (reason?: string) =>
  `<p style="margin:0;font-size:14px;color:#dc2626;">資料暫時無法取得${reason ? `：${escapeHtml(reason)}` : ""}</p>`;

export function renderDailyBriefEmail(brief: DailyBrief) {
  const { date, weather, markets, news, summary, errors } = brief;

  const encouragement = summary
    ? `<p style="margin:0;font-size:16px;line-height:1.7;color:#27272a;">${escapeHtml(summary.encouragement)}</p>`
    : unavailable(errors?.summary);

  const weatherBody = weather
    ? `<p style="margin:0;font-size:28px;font-weight:700;color:#18181b;">${escapeHtml(weather.currentTemp)}°C
         <span style="font-size:15px;font-weight:400;color:#71717a;">${escapeHtml(weather.description)}</span></p>
       <p style="margin:8px 0 0;font-size:14px;color:#3f3f46;">
         最高 ${escapeHtml(weather.maxTemp)}°C ・ 最低 ${escapeHtml(weather.minTemp)}°C ・ 降雨機率 ${escapeHtml(weather.rainChance)}%</p>
       ${note(summary?.weatherSummary)}`
    : unavailable(errors?.weather);

  // 每個指數：名稱一行，下面三格（收盤／漲跌／漲跌幅），手機上也不會擠壓名稱
  const cell = (label: string, value: string, color = "#18181b") =>
    `<td width="33%" style="padding:4px 10px 0 0;vertical-align:top;">
       <div style="font-size:12px;color:#71717a;">${label}</div>
       <div style="font-size:15px;line-height:22px;height:22px;font-weight:600;color:${color};white-space:nowrap;">${value}</div>
     </td>`;

  // ▲▼ 在手機上常被換成較高的符號字型，會把整行往下推；
  // 縮小並固定行高，︎ 要求以文字（非 emoji）樣式顯示
  const arrow = (up: boolean) =>
    `<span style="font-size:10px;line-height:10px;vertical-align:middle;">${up ? "▲" : "▼"}︎</span>`;

  const marketsBody = markets
    ? markets
        .map((m, i) => {
          const up = m.change >= 0;
          const color = up ? "#dc2626" : "#16a34a"; // 紅漲綠跌
          const sign = up ? "+" : "";
          // 間距與分隔線寫在 <td> 上：部分手機信箱會忽略 <div> 的 padding / border
          const top =
            i > 0 ? "padding-top:14px;border-top:1px solid #e4e4e7;" : "";
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td colspan="3" style="${top}font-size:15px;line-height:22px;font-weight:700;color:#18181b;">${escapeHtml(m.name)}</td></tr>
            <tr>
              ${cell("收盤", fmt(m.close))}
              ${cell("漲跌", `${arrow(up)} ${sign}${fmt(m.change)}`, color)}
              ${cell("漲跌幅", `${sign}${m.changePercent.toFixed(2)}%`, color)}
            </tr>
            <tr><td colspan="3" height="14" style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>
          </table>`;
        })
        .join("")
    : unavailable(errors?.markets);

  const highlights = summary
    ? `<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#27272a;">
        ${summary.newsSummary.map((s) => `<li style="margin-bottom:4px;">${escapeHtml(s)}</li>`).join("")}
       </ol>`
    : unavailable(errors?.summary);

  const newsBody = news
    ? news
        .map(
          (n) => `<p style="margin:0 0 12px;">
            <a href="${safeUrl(n.link)}" style="font-size:14px;font-weight:600;color:#2563eb;text-decoration:none;">${escapeHtml(n.title)}</a><br>
            <span style="font-size:13px;line-height:1.5;color:#71717a;">${escapeHtml(n.summary)}</span></p>`,
        )
        .join("")
    : unavailable(errors?.news);

  const marketDate = markets?.[0]?.date;

  const html = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>每日晨報</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
        <tr><td style="padding:28px 24px 20px;">
          <h1 style="margin:0;font-size:24px;color:#18181b;">每日晨報</h1>
          <p style="margin:4px 0 0;font-size:14px;color:#71717a;">${escapeHtml(date)}（台灣時間）</p>
        </td></tr>
        ${section("💪 給你的一段話", encouragement)}
        ${section("🌤️ 今日天氣" + (weather ? `・${escapeHtml(weather.location)}` : ""), weatherBody)}
        ${section("📈 美股四大指數" + (marketDate ? `・${escapeHtml(marketDate)} 收盤` : ""), marketsBody)}
        ${section("✨ AI 新聞重點", highlights)}
        ${section("📰 今日科技新聞", newsBody)}
        <tr><td style="padding:0 24px 24px;font-size:12px;color:#a1a1aa;text-align:center;">
          此信由 my-ai-email 自動產生
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `每日晨報｜${date}`,
    html,
  };
}
