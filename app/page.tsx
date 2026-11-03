"use client";

import { useCallback, useEffect, useState } from "react";
import type { DailyBrief } from "@/lib/daily/brief";

async function fetchBrief(): Promise<{ data?: DailyBrief; error?: string }> {
  try {
    const res = await fetch("/api/daily-brief", { cache: "no-store" });
    if (!res.ok) throw new Error(`API 回應 ${res.status}`);
    return { data: await res.json() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

const formatTime =(iso: string) =>
  iso
    ? new Date(iso).toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900 ${className}`}
    >
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Unavailable({ reason }: { reason?: string }) {
  return (
    <p className="text-sm text-red-600 dark:text-red-400">
      資料暫時無法取得{reason ? `：${reason}` : ""}
    </p>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
        />
      ))}
      <p className="text-center text-sm text-zinc-500 md:col-span-2">
        正在抓取資料並請 AI 統整，大約需要 10–20 秒…
      </p>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((r: { data?: DailyBrief; error?: string }) => {
    if (r.data) setData(r.data);
    setError(r.error ?? null);
    setLoading(false);
  }, []);

  // 首次載入（loading 初始值已是 true）
  useEffect(() => {
    fetchBrief().then(apply);
  }, [apply]);

  const load = () => {
    setLoading(true);
    fetchBrief().then(apply);
  };

  const { weather, markets, news, summary, errors } = data ?? {};

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">每日晨報</h1>
          {data && (
            <p className="mt-1 text-zinc-500">{data.date}（台灣時間）</p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "載入中…" : "重新整理"}
        </button>
      </header>

      {error && (
        <p className="mb-6 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
          載入失敗：{error}
        </p>
      )}

      {loading && !data ? (
        <Skeleton />
      ) : (
        data && (
          <div
            className={`grid gap-4 md:grid-cols-2 ${loading ? "opacity-50" : ""}`}
          >
            {/* 鼓勵的話 */}
            <Card
              title="給你的一段話"
              icon="💪"
              className="bg-gradient-to-br from-amber-50 to-rose-50 md:col-span-2 dark:from-amber-950/40 dark:to-rose-950/40"
            >
              {summary ? (
                <p className="text-lg leading-relaxed">
                  {summary.encouragement}
                </p>
              ) : (
                <Unavailable reason={errors?.summary} />
              )}
            </Card>

            {/* 天氣 */}
            <Card title={`今日天氣・${weather?.location ?? ""}`} icon="🌤️">
              {weather ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold">
                      {weather.currentTemp}°C
                    </span>
                    <span className="text-zinc-500">{weather.description}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-zinc-500">最高</dt>
                      <dd className="font-medium">{weather.maxTemp}°C</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">最低</dt>
                      <dd className="font-medium">{weather.minTemp}°C</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">降雨機率</dt>
                      <dd className="font-medium">{weather.rainChance}%</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <Unavailable reason={errors?.weather} />
              )}
              {summary && (
                <p className="mt-4 border-t border-black/5 pt-3 text-sm leading-relaxed text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                  {summary.weatherSummary}
                </p>
              )}
            </Card>

            {/* 美股四大指數 */}
            <Card
              title={`美股四大指數${markets?.[0] ? `・${markets[0].date} 收盤` : ""}`}
              icon="📈"
            >
              {markets ? (
                <ul className="divide-y divide-black/5 dark:divide-white/10">
                  {markets.map((m) => {
                    const up = m.change >= 0;
                    // 台灣慣例：紅漲綠跌
                    const color = up ? "text-red-600" : "text-green-600";
                    const sign = up ? "+" : "";
                    // 名稱一行，下面三格：收盤／漲跌／漲跌幅
                    return (
                      <li key={m.symbol} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-semibold">{m.name}</p>
                        <dl className="mt-1 grid grid-cols-3 gap-2 tabular-nums">
                          <div>
                            <dt className="text-xs text-zinc-500">收盤</dt>
                            <dd className="font-medium leading-6">
                              {m.close.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-zinc-500">漲跌</dt>
                            <dd className={`font-medium leading-6 ${color}`}>
                              {/* 箭頭縮小並固定行高，避免手機上把數字往下推 */}
                              <span className="align-middle text-[0.65em] leading-none">
                                {up ? "▲︎" : "▼︎"}
                              </span>{" "}
                              {sign}
                              {m.change.toFixed(2)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-zinc-500">漲跌幅</dt>
                            <dd className={`font-medium leading-6 ${color}`}>
                              {sign}
                              {m.changePercent.toFixed(2)}%
                            </dd>
                          </div>
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Unavailable reason={errors?.markets} />
              )}
            </Card>

            {/* AI 新聞重點 */}
            <Card title="AI 新聞重點" icon="✨" className="md:col-span-2">
              {summary ? (
                <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
                  {summary.newsSummary.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <Unavailable reason={errors?.summary} />
              )}
            </Card>

            {/* 新聞列表 */}
            <Card title="今日科技新聞" icon="📰" className="md:col-span-2">
              {news ? (
                <ul className="divide-y divide-black/5 dark:divide-white/10">
                  {news.map((item) => (
                    <li key={item.link} className="py-3 first:pt-0 last:pb-0">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {item.title}
                      </a>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                        {item.summary}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {formatTime(item.publishedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <Unavailable reason={errors?.news} />
              )}
            </Card>
          </div>
        )
      )}
    </main>
  );
}
