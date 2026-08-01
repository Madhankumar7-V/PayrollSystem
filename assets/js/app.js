/* ==========================================================================
   BMNT PAYROLL — MAIN APPLICATION ENTRY POINT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initUIElements === 'function') initUIElements();
  if (typeof initLogin === 'function') initLogin();
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof renderEmployees === 'function') renderEmployees();
  if (typeof renderDocuments === 'function') renderDocuments();
  if (typeof refreshDashboard === 'function') refreshDashboard();

  const now = new Date();
  const currentMonthYearEl = document.getElementById('currentMonthYear');
  if (currentMonthYearEl) {
    currentMonthYearEl.innerText = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  const bulkMonthInput = document.getElementById('bulkMonth');
  if (bulkMonthInput) {
    bulkMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const twFilterMonthInput = document.getElementById('twFilterMonth');
  if (twFilterMonthInput) {
    twFilterMonthInput.value = months[now.getMonth()];
  }

  const twFilterYearInput = document.getElementById('twFilterYear');
  if (twFilterYearInput) {
    twFilterYearInput.value = now.getFullYear();
  }

  if (typeof populateEmployeeDropdowns === 'function') populateEmployeeDropdowns();
  if (typeof initSidebarCollapse === 'function') initSidebarCollapse();
  if (typeof initGlobalSearch === 'function') initGlobalSearch();
  if (typeof initKeyboardShortcuts === 'function') initKeyboardShortcuts();
  if (typeof attachCalculationListeners === 'function') attachCalculationListeners();
});
