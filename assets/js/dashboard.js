/* ==========================================================================
   BMNT PAYROLL — DASHBOARD ANALYTICS & ACTIVITY LOGIC
   ========================================================================== */
async function updateDashboard() {
  const empEl = document.getElementById('dashTotalEmp');
  const payEl = document.getElementById('dashTotalPayslips');
  if (empEl) empEl.innerText = employees.length;
  if (payEl) payEl.innerText = payslips.length;

  const currMonth = new Date().toISOString().slice(0, 7);
  const currentMonthPayslips = payslips.filter(p => p.month === currMonth);
  const now = new Date();
  const currTwMonth = months[now.getMonth()];
  const currTwYear = now.getFullYear().toString();
  const currentTypistEntries = typistEntries.filter(e => e.month === currTwMonth && e.year === currTwYear);
  const totalPayroll = currentMonthPayslips.reduce((acc, curr) => acc + curr.netPay, 0) + currentTypistEntries.reduce((acc, curr) => acc + curr.net, 0);
  
  const totPayEl = document.getElementById('dashTotalPayroll');
  if (totPayEl) totPayEl.innerText = totalPayroll.toLocaleString('en-IN');

  const typists = employees.filter(e => e.department.trim().toLowerCase() === 'typist cell');
  const activeTypistIds = new Set(currentTypistEntries.map(e => e.empId));
  
  const actTypEl = document.getElementById('dashActiveTypists');
  const totTypLine = document.getElementById('dashTotalTypistsLine');
  const compWorkEl = document.getElementById('dashCompletedWork');
  if (actTypEl) actTypEl.innerText = activeTypistIds.size;
  if (totTypLine) totTypLine.innerText = `of ${typists.length} total typists`;
  if (compWorkEl) compWorkEl.innerText = currentTypistEntries.length;

  const docs = await getAllDocuments();
  const totDocsEl = document.getElementById('dashTotalDocs');
  const navDocBadge = document.getElementById('navDocBadge');
  if (totDocsEl) totDocsEl.innerText = docs.length;
  if (navDocBadge) navDocBadge.innerText = docs.length;
}

async function refreshDashboard() {
  await updateDashboard();
  if (typeof renderPayrollChart === 'function') await renderPayrollChart();
  await renderRecentActivity();
}

async function renderRecentActivity() {
  const docs = await getAllDocuments();
  const recent = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const list = document.getElementById('recentActivityList');
  if (!list) return;
  if (recent.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:30px 10px;"><div class="es-icon"><i class="fa-solid fa-inbox"></i></div><h3>No activity yet</h3><p>Generated payslips and reports will show up here.</p></div>`;
    return;
  }
  list.innerHTML = recent.map(d => {
    const icon = d.category === 'Payslip' ? 'fa-file-invoice-dollar' : d.category === 'Monthly Report' ? 'fa-chart-line' : 'fa-keyboard';
    const when = new Date(d.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    return `<div class="activity-item"><div class="activity-icon"><i class="fa-solid ${icon}"></i></div><div class="activity-meta"><b>${d.name}</b><span>${d.category} &middot; ${when}</span></div></div>`;
  }).join('');
}
