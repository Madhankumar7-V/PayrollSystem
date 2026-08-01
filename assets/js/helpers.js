/* ==========================================================================
   BMNT PAYROLL — HELPER FUNCTIONS & MODAL / TOAST UTILITIES
   ========================================================================== */
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('active');
  });
});

function confirmAction(message, title = 'Are you sure?') {
  return new Promise((resolve) => {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMsg').innerText = message;
    openModal('confirmModal');
    const okBtn = document.getElementById('confirmModalOk');
    const cancelBtn = document.getElementById('confirmModalCancel');
    const cleanup = () => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeModal('confirmModal');
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

function showToast(message, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, 3400);
}

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function calcTweNet() {
  const earn = parseFloat(document.getElementById('tweEarn').value) || 0;
  const ded = parseFloat(document.getElementById('tweDed').value) || 0;
  document.getElementById('tweNet').value = (earn - ded).toFixed(2);
}

function resetTweForm() {
  document.getElementById('typistEntryForm').reset();
  document.getElementById('tweIndex').value = "-1";
  document.getElementById('tweDed').value = "0";
}

let pendingDocReady = null;
function openDocReadyModal(blob, filename) {
  pendingDocReady = { blob, filename };
  document.getElementById('docReadyName').innerText = filename;
  document.getElementById('docReadySize').innerText = fmtBytes(blob.size) + ' · PDF Document';
  openModal('docReadyModal');
}
document.getElementById('docReadySaveBtn').addEventListener('click', () => {
  if (pendingDocReady) saveBlobToComputer(pendingDocReady.blob, pendingDocReady.filename);
});
document.getElementById('docReadyCloseBtn').addEventListener('click', () => {
  closeModal('docReadyModal');
  goToSection('documents');
});
