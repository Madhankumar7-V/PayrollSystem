/* ==========================================================================
   BMNT PAYROLL — CHART.JS INTEGRATION
   ========================================================================== */
async function renderPayrollChart() {
  const ctx = document.getElementById('payrollChart');
  if (!ctx) return;
  const now = new Date();
  const labels = [];
  const dataPoints = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = months[d.getMonth()];
    const yearStr = d.getFullYear().toString();
    labels.push(d.toLocaleString('default', { month: 'short' }));
    const regularTotal = payslips.filter(p => p.month === monthKey).reduce((a, c) => a + c.netPay, 0);
    const typistTotal = typistEntries.filter(e => e.month === monthName && e.year === yearStr).reduce((a, c) => a + c.net, 0);
    dataPoints.push(regularTotal + typistTotal);
  }
  const isDark = document.body.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(14,37,36,.06)';
  const textColor = isDark ? '#b9d0cd' : '#7a908f';
  if (window._payrollChart) window._payrollChart.destroy();
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(0,91,92,.35)');
  gradient.addColorStop(1, 'rgba(0,91,92,0)');
  window._payrollChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Payroll (₹)',
        data: dataPoints,
        borderColor: '#00787a',
        backgroundColor: gradient,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#f4b400',
        pointBorderColor: '#00787a',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => '₹' + c.parsed.y.toLocaleString('en-IN') } }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor, callback: (v) => '₹' + v.toLocaleString('en-IN') }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });
}
