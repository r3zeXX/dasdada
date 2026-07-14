/**
 * Charting Module utilizing Chart.js
 */
const DashboardCharts = (() => {
  let weatherChartInstance = null;
  let aqiChartInstance = null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: 'var(--color-text)' } }
    },
    scales: {
      x: { 
        ticks: { color: 'var(--color-muted)', maxTicksLimit: 8 },
        grid: { color: 'var(--color-border)' }
      },
      y: { 
        ticks: { color: 'var(--color-muted)' },
        grid: { color: 'var(--color-border)' }
      }
    }
  };

  const renderWeatherChart = (hourlyData) => {
    const ctx = document.getElementById('chart-weather');
    if (!ctx || !hourlyData) return;

    // Get next 24 hours
    const times = hourlyData.time.slice(0, 24).map(t => new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    const temps = hourlyData.temperature_2m.slice(0, 24);
    const hums = hourlyData.relative_humidity_2m.slice(0, 24);

    if (weatherChartInstance) weatherChartInstance.destroy();

    weatherChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: times,
        datasets: [
          {
            label: 'อุณหภูมิ (°C)',
            data: temps,
            borderColor: '#FF9500',
            backgroundColor: 'rgba(255, 149, 0, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'ความชื้น (%)',
            data: hums,
            borderColor: '#34C759',
            borderDash: [5, 5],
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: 'var(--color-muted)' } }
        }
      }
    });
  };

  const renderAQIChart = (hourlyData) => {
    const ctx = document.getElementById('chart-aqi');
    if (!ctx || !hourlyData) return;

    const times = hourlyData.time.slice(0, 24).map(t => new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    const pm25 = hourlyData.pm2_5.slice(0, 24);
    const aqi = hourlyData.us_aqi.slice(0, 24);

    if (aqiChartInstance) aqiChartInstance.destroy();

    aqiChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: times,
        datasets: [
          {
            label: 'AQI',
            data: aqi,
            backgroundColor: '#007AFF',
            borderRadius: 4
          },
          {
            label: 'PM2.5',
            data: pm25,
            type: 'line',
            borderColor: '#FF3B30',
            tension: 0.4
          }
        ]
      },
      options: chartOptions
    });
  };

  return { renderWeatherChart, renderAQIChart };
})();

window.dashboardCharts = DashboardCharts;
