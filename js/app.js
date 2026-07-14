/**
 * AeroDash — App Controller v4.3
 *
 * Key fixes:
 *  1. "Latest wins" pattern — no request is ever silently dropped
 *  2. Loading state ALWAYS cleared (success or failure) via finally()
 *  3. No isLoadingData flag that could get stuck
 *  4. Renders only if province is still the latest requested
 */
const App = (() => {
  let provinces       = [];
  let map             = null;
  let activeMarker    = null;
  let latestReqId     = null; // tracks the LAST province the user selected
  let debounceTimer   = null;

  // Apply saved theme before first paint (prevents flash)
  (() => {
    const t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  })();

  // ── WMO code tables ───────────────────────────────────────────────
  const WMO = {
    0:'ท้องฟ้าแจ่มใส', 1:'ท้องฟ้าแจ่มใสเป็นส่วนใหญ่', 2:'มีเมฆบางส่วน', 3:'มีเมฆมาก',
    45:'มีหมอก', 48:'มีหมอกหนา',
    51:'ฝนปรอยๆ เบา', 53:'ฝนปรอยๆ', 55:'ฝนปรอยๆ หนาแน่น',
    61:'ฝนตกเล็กน้อย', 63:'ฝนตกปานกลาง', 65:'ฝนตกหนัก',
    80:'ฝนฟ้าคะนองเบา', 81:'ฝนฟ้าคะนองปานกลาง', 82:'ฝนฟ้าคะนองรุนแรง',
    95:'พายุฝนฟ้าคะนอง', 96:'พายุลูกเห็บ', 99:'พายุลูกเห็บรุนแรง'
  };

  const SVG = {
    sun:   `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon:  `<svg viewBox="0 0 24 24" fill="none" stroke="#5E5CE6" stroke-width="1.5" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="#86868B" stroke-width="1.5" stroke-linecap="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    rain:  `<svg viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="1.5" stroke-linecap="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M16 20v-2"/><path d="M12 22v-4"/><path d="M8 20v-2"/></svg>`,
    storm: `<svg viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="1.5" stroke-linecap="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>`,
    fog:   `<svg viewBox="0 0 24 24" fill="none" stroke="#86868B" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/><path d="M5.5 10a6 6 0 0 1 11 2h1.5a4.5 4.5 0 0 1 0 9H6"/></svg>`
  };

  const getWeatherInfo = (code, isDay) => {
    if (code === 0)      return { bg: isDay ? 'weather-bg--clear' : 'weather-bg--night', icon: isDay ? SVG.sun : SVG.moon };
    if (code <= 2)       return { bg: 'weather-bg--partly-cloudy', icon: SVG.cloud };
    if (code === 3)      return { bg: 'weather-bg--cloudy',        icon: SVG.cloud };
    if (code <= 48)      return { bg: 'weather-bg--fog',           icon: SVG.fog   };
    if (code <= 82)      return { bg: 'weather-bg--rain',          icon: SVG.rain  };
    return               { bg: 'weather-bg--thunderstorm',  icon: SVG.storm };
  };

  const AQI_LEVELS = [
    [50,  '#34C759', 'rgba(52,199,89,.1)',   'ยอดเยี่ยม',           'อากาศดีมาก ทำกิจกรรมกลางแจ้งได้ตามปกติ'],
    [100, '#8ECC39', 'rgba(142,204,57,.1)',  'ดี',                   'คุณภาพอากาศอยู่ในระดับดี'],
    [150, '#FFCC00', 'rgba(255,204,0,.1)',   'ปานกลาง',             'กลุ่มเสี่ยงควรลดเวลากิจกรรมกลางแจ้ง'],
    [200, '#FF9500', 'rgba(255,149,0,.1)',   'เริ่มมีผลกระทบ',      'ควรลดการทำกิจกรรมกลางแจ้ง'],
    [300, '#FF3B30', 'rgba(255,59,48,.1)',   'มีผลกระทบต่อสุขภาพ', 'หลีกเลี่ยงกิจกรรมกลางแจ้ง'],
    [500, '#AF52DE', 'rgba(175,82,222,.1)',  'อันตราย',             'งดกิจกรรมกลางแจ้งทุกชนิด']
  ];
  const getAQIInfo = (v) => {
    const lvl = AQI_LEVELS.find(([max]) => v <= max) ?? AQI_LEVELS.at(-1);
    return { color: lvl[1], bg: lvl[2], text: lvl[3], rec: lvl[4] };
  };

  const getTempColor = (t) => {
    if (t <= 15) return '#5E5CE6';
    if (t <= 25) return '#34C759';
    if (t <= 32) return '#FF9500';
    return '#FF3B30';
  };

  // ── Tiny DOM helpers ──────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  /** Set text and trigger a tiny pop animation */
  const setVal = (id, text) => {
    const el = $(id);
    if (!el) return;
    el.textContent = (text !== null && text !== undefined) ? text : '--';
    el.classList.remove('val-updated');
    void el.offsetWidth; // force reflow to restart CSS animation
    el.classList.add('val-updated');
  };

  const fmt24 = { hour: '2-digit', minute: '2-digit' };

  // ── Toast ─────────────────────────────────────────────────────────
  const showToast = (msg, type = 'info') => {
    const c = $('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `c-toast${type === 'error' ? ' c-toast--error' : ''}`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 3500);
  };

  // ── Loading state helpers ─────────────────────────────────────────
  const setCardLoading = (loading) => {
    ['weather-content', 'aqi-content'].forEach(id => {
      const el = $(id);
      if (!el) return;
      if (loading) {
        el.classList.add('is-loading');
        el.classList.remove('is-loaded');
      } else {
        el.classList.remove('is-loading');
        el.classList.add('is-loaded');
      }
    });
  };

  // ── Map ───────────────────────────────────────────────────────────
  const initMap = () => {
    const mapEl = $('map');
    if (!mapEl || typeof L === 'undefined') return;

    map = L.map(mapEl, { zoomControl: true, attributionControl: false })
           .setView([13.0, 101.5], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 13, subdomains: 'abcd'
    }).addTo(map);

    // All province dots added at once
    provinces.forEach(p => {
      L.circleMarker([p.lat, p.lon], {
        radius: 5, color: '#007AFF',
        fillColor: '#007AFF', fillOpacity: 0.35, weight: 1.5
      })
      .bindTooltip(p.name_th, { direction: 'top', offset: [0, -8] })
      .on('click', () => {
        $('province-select').value = p.id;
        loadProvinceData(p.id);
      })
      .addTo(map);
    });
  };

  const flyToProvince = (prov) => {
    if (!map) return;
    if (activeMarker) map.removeLayer(activeMarker);
    activeMarker = L.circleMarker([prov.lat, prov.lon], {
      radius: 13, color: '#FF3B30',
      fillColor: '#FF3B30', fillOpacity: 0.25, weight: 2.5
    }).addTo(map);
    map.flyTo([prov.lat, prov.lon], 9, { animate: true, duration: 1.2 });
  };

  // ── Render weather ────────────────────────────────────────────────
  const renderWeather = (data, provName) => {
    if (!data || !data.current) return; // data is null → nothing to render

    const c  = data.current;
    const d  = data.daily  || {};
    const h  = data.hourly || {};
    const wi = getWeatherInfo(c.weather_code || 0, c.is_day || 0);

    // Background + icon
    const appBg = $('app-bg');
    if (appBg) appBg.className = `weather-bg ${wi.bg}`;
    const iconEl = $('icon-weather');
    if (iconEl) iconEl.innerHTML = wi.icon;

    // Big temperature (colour-coded)
    const tempEl = $('val-temp');
    if (tempEl) {
      tempEl.textContent = `${Math.round(c.temperature_2m)}°`;
      tempEl.style.color = getTempColor(c.temperature_2m);
      tempEl.classList.remove('val-updated');
      void tempEl.offsetWidth;
      tempEl.classList.add('val-updated');
    }

    setVal('val-desc',       WMO[c.weather_code] || 'ไม่ทราบสภาพอากาศ');
    setVal('val-province-w', provName);
    setVal('val-feels',      `${Math.round(c.apparent_temperature)}°C`);
    setVal('val-humidity',   `${c.relative_humidity_2m}%`);
    setVal('val-wind',       `${c.wind_speed_10m} km/h`);
    setVal('val-rain',       `${c.precipitation} mm`);
    setVal('val-pressure',   `${Math.round(c.pressure_msl)} hPa`);
    setVal('val-uv',          Array.isArray(d.uv_index_max) ? d.uv_index_max[0] : '--');

    const sunriseStr = Array.isArray(d.sunrise) && d.sunrise[0]
      ? new Date(d.sunrise[0]).toLocaleTimeString('th-TH', fmt24) : '--';
    const sunsetStr  = Array.isArray(d.sunset)  && d.sunset[0]
      ? new Date(d.sunset[0]).toLocaleTimeString('th-TH', fmt24)  : '--';
    setVal('val-sunrise', sunriseStr);
    setVal('val-sunset',  sunsetStr);

    // Charts
    if (typeof Chart !== 'undefined' && window.dashboardCharts) {
      window.dashboardCharts.renderWeatherChart(h);
    }
  };

  // ── Render AQI ────────────────────────────────────────────────────
  const renderAQI = (data, provName) => {
    if (!data || !data.current) return;

    const c  = data.current;
    const h  = data.hourly || {};
    const ai = getAQIInfo(c.us_aqi || 0);

    // AQI number (colour-coded)
    const aqiEl = $('val-aqi');
    if (aqiEl) {
      aqiEl.textContent = c.us_aqi !== null && c.us_aqi !== undefined ? c.us_aqi : '--';
      aqiEl.style.color = ai.color;
      aqiEl.classList.remove('val-updated');
      void aqiEl.offsetWidth;
      aqiEl.classList.add('val-updated');
    }

    setVal('val-aqi-desc',   ai.text);
    setVal('val-aqi-rec',    ai.rec);
    setVal('val-province-a', provName);
    setVal('val-pm25',  c.pm2_5             != null ? c.pm2_5.toFixed(1)             : '--');
    setVal('val-pm10',  c.pm10              != null ? c.pm10.toFixed(1)              : '--');
    setVal('val-co',    c.carbon_monoxide   != null ? Math.round(c.carbon_monoxide)  : '--');
    setVal('val-no2',   c.nitrogen_dioxide  != null ? c.nitrogen_dioxide.toFixed(1)  : '--');
    setVal('val-so2',   c.sulphur_dioxide   != null ? c.sulphur_dioxide.toFixed(1)   : '--');
    setVal('val-o3',    c.ozone             != null ? c.ozone.toFixed(1)             : '--');
    setVal('val-aqi-update',
      c.time ? `อัปเดต: ${new Date(c.time).toLocaleString('th-TH')}` : '');

    // AQI bar thumb
    const thumb = $('aqi-thumb');
    if (thumb) {
      const pct = Math.min(((c.us_aqi || 0) / 300) * 100, 100);
      thumb.style.left        = `${pct}%`;
      thumb.style.borderColor = ai.color;
    }

    // Charts
    if (typeof Chart !== 'undefined' && window.dashboardCharts) {
      window.dashboardCharts.renderAQIChart(h);
    }
  };

  // ── Load province data ────────────────────────────────────────────
  /**
   * "Latest wins" pattern:
   *  - latestReqId is always updated to the newest request
   *  - When data returns, we only render if it's still the latest
   *  - loading state is ALWAYS cleared in finally()
   */
  const loadProvinceData = (provId) => {
    const prov = provinces.find(p => p.id === provId);
    if (!prov) { console.warn('Province not found:', provId); return; }

    latestReqId = provId;                         // mark as latest
    localStorage.setItem('selectedProvince', provId);

    setCardLoading(true);
    flyToProvince(prov);

    const thisReqId = provId; // capture for closure comparison

    Promise.all([
      window.apiService.getWeather(prov.lat, prov.lon),
      window.apiService.getAQI(prov.lat, prov.lon)
    ])
    .then(([weatherData, aqiData]) => {
      // Only render if user hasn't changed province again while we were fetching
      if (thisReqId !== latestReqId) return;
      renderWeather(weatherData, prov.name_th);
      renderAQI(aqiData, prov.name_th);
    })
    .catch((err) => {
      if (thisReqId !== latestReqId) return;
      console.error('loadProvinceData failed:', err);
      const msg = err.message === 'OFFLINE'
        ? 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต'
        : 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่';
      showToast(msg, 'error');
    })
    .finally(() => {
      // Always clear loading state for the latest request
      if (thisReqId === latestReqId) setCardLoading(false);
    });
  };

  // ── Province dropdown ─────────────────────────────────────────────
  const buildDropdown = () => {
    const sel = $('province-select');
    if (!sel) { console.error('#province-select not found'); return; }
    if (!provinces.length) { console.error('provinces array is empty'); return; }

    const frag = document.createDocumentFragment();
    provinces.forEach(p => {
      const opt      = document.createElement('option');
      opt.value      = p.id;
      opt.textContent = p.name_th;
      frag.appendChild(opt);
    });
    sel.innerHTML = '';
    sel.appendChild(frag);

    // Restore last selected province (or default to first)
    const saved   = localStorage.getItem('selectedProvince');
    const startId = provinces.find(p => p.id === saved)?.id ?? provinces[0].id;
    sel.value = startId;

    sel.addEventListener('change', (e) => {
      clearTimeout(debounceTimer);
      // Short debounce so rapid scrolling through dropdown doesn't spam APIs
      debounceTimer = setTimeout(() => loadProvinceData(e.target.value), 150);
    });

    // Load initial province immediately
    loadProvinceData(startId);
  };

  // ── Theme toggle ──────────────────────────────────────────────────
  const initTheme = () => {
    const btn = $('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const curr = document.documentElement.getAttribute('data-theme');
      const next = curr === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  };

  // ── Entry point ───────────────────────────────────────────────────
  const init = async () => {
    initTheme();

    try {
      provinces = await window.apiService.getProvinces();
    } catch (e) {
      showToast('โหลดรายชื่อจังหวัดล้มเหลว', 'error');
      console.error(e);
      return;
    }

    buildDropdown(); // triggers initial loadProvinceData
    initMap();
  };

  return { init, showToast };
})();

// Scripts are at the bottom of <body> so DOM is ready — call init directly
App.init();
window.app = App;
