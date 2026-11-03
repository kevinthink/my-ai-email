// Yahoo Finance chart 端點：不需 token（非官方 API，需帶 User-Agent，否則會回 429）

const INDICES = [
  { symbol: "^DJI", name: "道瓊工業" },
  { symbol: "^GSPC", name: "標普 500" },
  { symbol: "^IXIC", name: "那斯達克" },
  { symbol: "^SOX", name: "費城半導體" },
] as const;

export type IndexQuote = {
  symbol: string;
  name: string;
  date: string; // 美東時間的交易日 YYYY-MM-DD
  close: number;
  previousClose: number;
  change: number;
  changePercent: number;
};

const round = (n: number, digits = 2) => Number(n.toFixed(digits));

const toNyDate = (unixSec: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(
    new Date(unixSec * 1000),
  );

async function getIndex(symbol: string, name: string): Promise<IndexQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Yahoo ${symbol} 回應 ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${symbol} 沒有資料`);

  // 取最後兩個有收盤價的交易日來計算漲跌
  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const days = timestamps
    .map((t, i) => ({ t, close: closes[i] }))
    .filter((d): d is { t: number; close: number } => d.close != null);
  if (days.length < 2) throw new Error(`Yahoo ${symbol} 資料不足`);

  const last = days.at(-1)!;
  const prev = days.at(-2)!;
  const change = last.close - prev.close;
  return {
    symbol,
    name,
    date: toNyDate(last.t),
    close: round(last.close),
    previousClose: round(prev.close),
    change: round(change),
    changePercent: round((change / prev.close) * 100),
  };
}

export async function getUsIndices(): Promise<IndexQuote[]> {
  return Promise.all(INDICES.map((i) => getIndex(i.symbol, i.name)));
}
