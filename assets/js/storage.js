/* ==========================================================================
   BMNT PAYROLL — STORAGE & DATA STATE
   ========================================================================== */
let employees = [];
let payslips = [];
let typistEntries = [];


/* ---------------- IndexedDB Document Repository ---------------- */
function openDocDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('BMNTPayrollDocs', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('documents')) {
        const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('employeeId', 'employeeId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDocumentToRepo(docData) {
  const db = await openDocDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    const rec = {
      name: docData.name,
      category: docData.category,
      employeeName: docData.employeeName || '',
      employeeId: docData.employeeId || '',
      month: docData.month || '',
      createdAt: new Date().toISOString(),
      size: docData.blob.size,
      blob: docData.blob
    };
    const req = store.add(rec);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllDocuments() {
  const db = await openDocDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readonly');
    const store = tx.objectStore('documents');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getDocument(id) {
  const db = await openDocDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readonly');
    const store = tx.objectStore('documents');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteDocumentFromRepo(id) {
  const db = await openDocDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function updateDocumentName(id, newName) {
  const db = await openDocDB();
  return new Promise(async (resolve, reject) => {
    const rec = await getDocument(id);
    if (!rec) return reject('Not found');
    rec.name = newName;
    const tx = db.transaction('documents', 'readwrite');
    const store = tx.objectStore('documents');
    const req = store.put(rec);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function saveBlobToComputer(blob, filename) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'Document File', accept: { [blob.type || 'application/octet-stream']: ['.pdf', '.zip'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return true;
}
