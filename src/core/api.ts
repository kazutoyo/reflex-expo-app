export type City = { id: number; name: string; region: string; latitude: number; longitude: number };
export type Forecast = {
  current: { temperature: number; code: number };
  daily: { date: string; code: number; max: number; min: number }[];
};

export type Api = {
  forecast(latitude: number, longitude: number): Promise<Forecast>;
  searchCities(query: string): Promise<City[]>;
  city(id: number): Promise<City>;
};

type Fetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

/** Open-Meteo (no API key needed). fetch is injected, so tests pass a fetch that returns fixtures. */
export function createHttpApi(fetch: Fetch): Api {
  const get = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  const toCity = (r: any): City => ({
    id: r.id,
    name: r.name,
    region: [r.admin1, r.country].filter((s, i, a) => s && a.indexOf(s) === i).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  });

  return {
    async forecast(latitude, longitude) {
      const q = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: 'temperature_2m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
      });
      const r = await get(`https://api.open-meteo.com/v1/forecast?${q}`);
      return {
        current: { temperature: r.current.temperature_2m, code: r.current.weather_code },
        daily: r.daily.time.map((date: string, i: number) => ({
          date,
          code: r.daily.weather_code[i],
          max: r.daily.temperature_2m_max[i],
          min: r.daily.temperature_2m_min[i],
        })),
      };
    },
    async searchCities(query) {
      const q = new URLSearchParams({ name: query, count: '10', language: 'ja' });
      const r = await get(`https://geocoding-api.open-meteo.com/v1/search?${q}`);
      return (r.results ?? []).map(toCity); // results is absent when there are 0 hits
    },
    async city(id) {
      return toCity(await get(`https://geocoding-api.open-meteo.com/v1/get?id=${id}&language=ja`));
    },
  };
}

/** WMO weather code → display text. */
export function describeWeather(code: number): string {
  if (code === 0) return '快晴';
  if (code <= 2) return '晴れ';
  if (code === 3) return 'くもり';
  if (code <= 48) return '霧';
  if (code <= 57) return '霧雨';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return 'にわか雨';
  if (code <= 86) return 'にわか雪';
  return '雷雨';
}
