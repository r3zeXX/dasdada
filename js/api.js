/**
 * API Service Layer
 * — In-memory cache (Map) with 15-min TTL
 * — Retry with backoff
 * — Offline detection
 */
const ApiService = (() => {
  const CACHE_TTL = 15 * 60 * 1000;
  const cache = new Map(); // key: url, value: { ts, data }

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const fromCache = (url) => {
    const hit = cache.get(url);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL) { cache.delete(url); return null; }
    return hit.data;
  };

  const toCache = (url, data) => cache.set(url, { ts: Date.now(), data });

  const fetchJSON = async (url, retries = 3) => {
    const cached = fromCache(url);
    if (cached) return cached;

    if (!navigator.onLine) throw new Error('OFFLINE');

    for (let i = 0; i < retries; i++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        toCache(url, data);
        return data;
      } catch (e) {
        if (i === retries - 1) throw e;
        await delay(800 * (i + 1));
      }
    }
  };

  // ── Provinces: use embedded JS (no fetch → works on file://) ──────
  const getProvinces = () => {
    if (Array.isArray(window.PROVINCES_DATA) && window.PROVINCES_DATA.length) {
      return Promise.resolve(window.PROVINCES_DATA);
    }
    return Promise.reject(new Error('PROVINCES_DATA missing — check js/provinces.js'));
  };

  // ── Weather ───────────────────────────────────────────────────────
  const getWeather = (lat, lon) => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m` +
      `&hourly=temperature_2m,relative_humidity_2m` +
      `&daily=sunrise,sunset,uv_index_max` +
      `&timezone=Asia%2FBangkok&forecast_days=2`;
    return fetchJSON(url);
  };

  // ── AQI ───────────────────────────────────────────────────────────
  const getAQI = (lat, lon) => {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi` +
      `&hourly=pm10,pm2_5,us_aqi` +
      `&timezone=Asia%2FBangkok&forecast_days=2`;
    return fetchJSON(url);
  };

  return { getProvinces, getWeather, getAQI };
})();

window.apiService = ApiService;
