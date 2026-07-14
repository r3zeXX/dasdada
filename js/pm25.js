/**
 * PM2.5 Module
 * Renders high-fidelity Air Quality widgets
 */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('pm25-container');
  if (!container) return;

  const getBadgeClass = (quality) => {
    const q = quality.toLowerCase();
    if (q.includes('ผลกระทบ') || q.includes('เริ่มมี')) return 'c-badge--warning';
    if (q.includes('อันตราย')) return 'c-badge--danger';
    return 'c-badge--success'; // ดี
  };

  const renderCard = (item, index) => {
    const badgeClass = getBadgeClass(item.quality);
    
    return `
      <article class="c-card u-anim-fade-in u-stagger-${index + 1}">
        <header class="c-card__header">
          <div>
            <h3 class="c-card__title">${item.province}</h3>
            <span style="font-size: var(--font-size-sm); color: var(--color-muted); display:block; margin-top: 4px;">อัปเดตเมื่อ ${item.updated}</span>
          </div>
          <span class="c-badge ${badgeClass}">${item.quality}</span>
        </header>
        
        <div class="c-card__body">
          <div class="c-stat-card u-mb-8" style="align-items: flex-start;">
            <div style="display:flex; align-items: baseline; gap: var(--space-2);">
              <span class="c-stat-card__value" style="color: ${item.color}">${item.pm25}</span>
              <span style="font-size: var(--font-size-xl); color: var(--color-muted); font-weight: 500;">µg/m³</span>
            </div>
            <span style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text);">มลพิษหลัก: PM2.5</span>
          </div>
          
          <div class="l-grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <div class="c-info-card">
              <span class="c-info-card__label">ดัชนีคุณภาพอากาศ</span>
              <span class="c-info-card__value">${item.aqi}</span>
            </div>
            <div class="c-info-card">
              <span class="c-info-card__label">ระดับ PM10</span>
              <span class="c-info-card__value">${item.pm10} µg/m³</span>
            </div>
          </div>
        </div>
        
        <footer class="c-card__footer">
          <a href="pm25.html?id=${item.id}" class="c-btn c-btn--outline" aria-label="ดูรายละเอียดคุณภาพอากาศสำหรับ ${item.province}">ดูคำแนะนำด้านสุขภาพ</a>
        </footer>
      </article>
    `;
  };

  const data = await window.apiService.getPM25();
  if (data.length === 0) {
    container.innerHTML = `
      <div class="c-card u-text-center" style="grid-column: 1 / -1; padding: var(--space-12);">
        <p style="color: var(--color-muted);">ไม่มีข้อมูลคุณภาพอากาศในขณะนี้</p>
        <button class="c-btn c-btn--primary u-mt-4" onclick="location.reload()">ลองเชื่อมต่อใหม่</button>
      </div>
    `;
    return;
  }
  container.innerHTML = data.map((item, index) => renderCard(item, index)).join('');
});
