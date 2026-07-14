/**
 * Simple Router for detail pages
 * Fetches context specific data based on query params
 */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const currentPath = window.location.pathname;

  if (currentPath.includes('weather.html')) {
    updateWeatherDetail(id);
  } else if (currentPath.includes('pm25.html')) {
    updatePM25Detail(id);
  }
});

async function updateWeatherDetail(id) {
  const data = await window.apiService.getWeather();
  const item = data.find(d => d.id === id);
  if (item) {
    const title = document.getElementById('detail-title');
    if (title) title.textContent = `แบบจำลองสภาพบรรยากาศ ${item.province}`;
    
    if (window.app) window.app.showToast(`โหลดข้อมูลการวิเคราะห์สำหรับ ${item.province} สำเร็จ`, 'success');
  }
}

async function updatePM25Detail(id) {
  const data = await window.apiService.getPM25();
  const item = data.find(d => d.id === id);
  if (item) {
    const title = document.getElementById('detail-title');
    if (title) title.textContent = `การวิเคราะห์ฝุ่นละออง ${item.province}`;
    
    if (window.app) window.app.showToast(`โหลดตัวชี้วัดสำหรับ ${item.province} สำเร็จ`, 'success');
  }
}
