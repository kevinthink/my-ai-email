// Open-Meteo：免費、不需 API key
// https://open-meteo.com/en/docs

const TAIPEI = { name: "台北", latitude: 25.033, longitude: 121.5654 };

// WMO weather code → 中文描述
const WEATHER_CODE: Record<number, string> = {
  0: "晴天",
  1: "大致晴朗",
  2: "局部多雲",
  3: "陰天",
  45: "有霧",
  48: "霧凇",
  51: "毛毛雨（小）",
  53: "毛毛雨（中）",
  55: "毛毛雨（大）",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "陣雨（小）",
  81: "陣雨（中）",
  82: "陣雨（大）",
  95: "雷雨",
  96: "雷雨伴隨冰雹",
  99: "強雷雨伴隨冰雹",
};

export type Weather = {
  location: string;
  date: string;
  description: string;
  currentTemp: number;
  maxTemp: number;
  minTemp: number;
  rainChance: number;
};

export async function getTodayWeather(): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(TAIPEI.latitude),
    longitude: String(TAIPEI.longitude),
    current: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Taipei",
    forecast_days: "1",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Open-Meteo 回應 ${res.status}`);
  const data = await res.json();

  const code: number = data.daily.weather_code[0];
  return {
    location: TAIPEI.name,
    date: data.daily.time[0],
    description: WEATHER_CODE[code] ?? `天氣代碼 ${code}`,
    currentTemp: data.current.temperature_2m,
    maxTemp: data.daily.temperature_2m_max[0],
    minTemp: data.daily.temperature_2m_min[0],
    rainChance: data.daily.precipitation_probability_max[0],
  };
}
