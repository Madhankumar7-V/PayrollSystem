/* ==========================================================================
   BMNT PAYROLL — GLOBAL SEARCH MODULE
   ========================================================================== */
function initGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  const results = document.getElementById('globalSearchResults');
  if (!input || !results) return;

  input.addEventListener('input', async () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove('active'); return; }
    let html = '';
    const empMatches = employees.filter(e => e.name.toLowerCase().includes(q) || e.qcid.toLowerCase().includes(q)).slice(0, 5);
    empMatches.forEach(e => {
      html += `<div class="sr-item" onclick="goToSection('employees'); document.getElementById('searchEmp').value='${e.name.replace(/'/g, "\\'")}'; renderEmployees(); document.getElementById('globalSearchResults').classList.remove('active');"><i class="fa-solid fa-user"></i> ${e.name} <span style="color:var(--ink-faint); font-size:11px; margin-left:auto;">${e.qcid}</span></div>`;
    });
    const docs = await getAllDocuments();
    const docMatches = docs.filter(d => (d.name || '').toLowerCase().includes(q) || (d.employeeName || '').toLowerCase().includes(q) || (d.employeeId || '').toLowerCase().includes(q)).slice(0, 5);
    docMatches.forEach(d => {
      html += `<div class="sr-item" onclick="goToSection('documents'); document.getElementById('globalSearchResults').classList.remove('active');"><i class="fa-solid fa-file-pdf"></i> ${d.name} <span style="color:var(--ink-faint); font-size:11px; margin-left:auto;">${d.category}</span></div>`;
    });
    results.innerHTML = html || `<div class="sr-empty">No matches for "${q}"</div>`;
    results.classList.add('active');
  });
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('globalSearchWrap');
    if (wrap && !wrap.contains(e.target)) results.classList.remove('active');
  });
}
