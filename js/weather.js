/**
 * Weather Module
 * Renders high-fidelity Weather widgets
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('weather-container');
  if (!container) return;

  const getWeatherIcon = (iconCode) => {
    // Return high quality SVG based on mock data icon string
    if (iconCode.includes('ฝน') || iconCode.includes('🌧')) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M16 20v-2"/><path d="M12 22v-4"/><path d="M8 20v-2"/></svg>`;
    }
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="4"/><path d="M18 12a6 6 0 0 1-6 6"/></svg>`;
  };

  const renderCard = (item, index) => {
    const iconSvg = getWeatherIcon(item.status);
    
    return `
      <article class="c-card u-anim-fade-in u-stagger-${index + 1}">
        <header class="c-card__header">
          <div>
            <h3 class="c-card__title">${item.province}</h3>
            <span style="font-size: var(--font-size-sm); color: var(--color-muted); display:block; margin-top: 4px;">${item.date} • ${item.time}</span>
          </div>
          <div aria-hidden="true" style="padding: 12px; background: var(--color-background); border-radius: var(--radius-full);">${iconSvg}</div>
        </header>
        <div class="c-card__body">
          <div class="c-stat-card u-mb-8">
            <span class="c-stat-card__value">${item.temperature}°C</span>
            <span style="font-size: var(--font-size-lg); color: var(--color-muted); font-weight: 500;">${item.status}</span>
          </div>
          <div class="l-grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <div class="c-info-card">
              <span class="c-info-card__label">ความชื้น</span>
              <span class="c-info-card__value">${item.humidity}%</span>
            </div>
            <div class="c-info-card">
              <span class="c-info-card__label">ลม</span>
              <span class="c-info-card__value">${item.wind}</span>
            </div>
          </div>
        </div>
        <footer class="c-card__footer">
          <a href="weather.html?id=${item.id}" class="c-btn c-btn--outline" aria-label="ดูรายละเอียดสำหรับ ${item.province}">ดูพยากรณ์อากาศแบบเต็ม</a>
        </footer>
      </article>
    `;
  };

  const data = await window.apiService.getWeather();
  if (data.length === 0) {
    container.innerHTML = `
      <div class="c-card u-text-center" style="grid-column: 1 / -1; padding: var(--space-12);">
        <p style="color: var(--color-muted);">ไม่มีข้อมูลโทรมาตรในขณะนี้</p>
        <button class="c-btn c-btn--primary u-mt-4" onclick="location.reload()">ลองเชื่อมต่อใหม่</button>
      </div>
    `;
    return;
  }
  container.innerHTML = data.map((item, index) => renderCard(item, index)).join('');
});
