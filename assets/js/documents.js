/* ==========================================================================
   BMNT PAYROLL — DOCUMENTS REPOSITORY UI MODULE
   ========================================================================== */
async function renderDocuments() {
  const wrap = document.getElementById('docGridWrap');
  const emptyState = document.getElementById('docEmptyState');
  if (!wrap || !emptyState) return;

  const searchInput = document.getElementById('docSearch');
  const categorySelect = document.getElementById('docCategoryFilter');
  const sortBySelect = document.getElementById('docSortBy');

  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const category = categorySelect ? categorySelect.value : '';
  const sortBy = sortBySelect ? sortBySelect.value : 'date_desc';

  let docs = await getAllDocuments();
  docs = docs.filter(d => {
    const matchesSearch = !search || (d.name || '').toLowerCase().includes(search) || (d.employeeName || '').toLowerCase().includes(search) || (d.employeeId || '').toLowerCase().includes(search) || (d.month || '').toLowerCase().includes(search);
    const matchesCat = !category || d.category === category;
    return matchesSearch && matchesCat;
  });

  docs.sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date_asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'size_desc') return b.size - a.size;
    return 0;
  });

  if (docs.length === 0) {
    wrap.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = `<div class="empty-state"><div class="es-icon"><i class="fa-solid fa-folder-open"></i></div><h3>No documents found</h3><p>Generated payslips and reports are saved here automatically. Try adjusting your search or filters, or generate a document.</p></div>`;
    return;
  }
  wrap.style.display = 'grid';
  emptyState.style.display = 'none';

  const catBadge = { 'Payslip': 'badge-teal', 'Typist Report': 'badge-gold', 'Monthly Report': 'badge-info' };
  wrap.innerHTML = docs.map(d => {
    const when = new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `
    <div class="doc-card">
      <div class="doc-card-top">
        <div class="doc-ic"><i class="fa-solid fa-file-pdf"></i></div>
        <div style="flex:1; min-width:0;">
          <div class="doc-card-name">${d.name}</div>
          <div class="doc-card-meta">
            <span class="badge ${catBadge[d.category] || 'badge-teal'}">${d.category}</span>
            <span>${fmtBytes(d.size)}</span>
          </div>
          <div class="doc-card-meta"><i class="fa-regular fa-calendar" style="font-size:10px;"></i> ${when}</div>
        </div>
      </div>
      <div class="doc-card-actions">
        <button class="btn btn-secondary" onclick="previewDocument(${d.id})" data-tip="Preview"><i class="fa-solid fa-eye"></i></button>
        <button class="btn btn-secondary" onclick="renameDocument(${d.id})" data-tip="Rename"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-primary" onclick="downloadDocument(${d.id})" data-tip="Download"><i class="fa-solid fa-download"></i></button>
        <button class="btn btn-danger" onclick="deleteDocument(${d.id})" data-tip="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

async function previewDocument(id) {
  const rec = await getDocument(id);
  if (!rec) return;
  const url = URL.createObjectURL(rec.blob);
  document.getElementById('previewDocFrame').src = url;
  document.getElementById('previewDocTitle').innerHTML = `<i class="fa-solid fa-file-pdf"></i> ${rec.name}`;
  openModal('previewDocModal');
}

async function downloadDocument(id) {
  const rec = await getDocument(id);
  if (!rec) return;
  await saveBlobToComputer(rec.blob, rec.name);
}

let renameTargetId = null;
async function renameDocument(id) {
  const rec = await getDocument(id);
  if (!rec) return;
  renameTargetId = id;
  document.getElementById('renameDocInput').value = rec.name;
  openModal('renameDocModal');
}

document.getElementById('renameDocSaveBtn').addEventListener('click', async () => {
  const newName = document.getElementById('renameDocInput').value.trim();
  if (!newName || renameTargetId === null) return;
  await updateDocumentName(renameTargetId, newName);
  closeModal('renameDocModal');
  renderDocuments();
  showToast('Document renamed.', 'success');
});

async function deleteDocument(id) {
  const ok = await confirmAction('Delete this document from your internal repository? This cannot be undone.', 'Delete Document');
  if (!ok) return;
  await deleteDocumentFromRepo(id);
  renderDocuments();
  refreshDashboard();
  showToast('Document deleted.', 'success');
}
