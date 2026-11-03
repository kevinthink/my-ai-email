import { connection, NextResponse } from "next/server";
import { getDailyBrief } from "@/lib/daily/brief";

export async function GET() {
  // 每次請求都即時抓取，不在 build 時預先產生
  await connection();
  return NextResponse.json(await getDailyBrief());
}
