/* ==========================================================================
   BMNT PAYROLL — STORAGE & DATA STATE
   ========================================================================== */
let employees = [];
let payslips = [];
let typistEntries = [];


const LOGO_BLACK_B64 = "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MIAfeughS1KJwibSbZB3X7nmmmusQ4cOldvKMDyATS++JMeDw+GwTj/9dGvfvn35GunhIz6VKlWyXC6XvV+eiOPX5XJZbrc713527rnnWm+88UaJRynCG5ArV6602rVrl+/YO9H1ofmN7733XoUN31MqgM0GPHDggNWxY0e7csvb2j9VHuE9hMTERGv58uUlCrjjEcDhD/Md3W63XcmcyBA2nz1y5Ei7pX4se0UnKoDz9kbM+1966aXWgQMH7N5heQ7gkpSJOf7r1atnHTx4sMAAM+87e/bsctULzrvvDRs2zP6uhQVW+HZ74okn7Neb0C0Pv8tst+HDh+cqfwL4JD/nm52dbXXq1MluHZ+KwVtYBZ+UlGStWLGi2IA73gEcXknGxcVZ33777QlrEZtymT59ul1RHOvfXh4COPy8sCTrT3/6kz0SUJ5CuDQBXLdu3UIDOHzUo2vXruVuKDo8iG+44QYrMzOzwGMkvOd733332cduefstkqzzzz/fysrKKnf7WFmr8OturLBZtH379tUnn3wij8cjv9/PHPiwmeAHDx5Uly5dtHHjRrlcLgWDwXI109jlcikrK0t9+/a1t511HGemmu+wfv16jRgxwi4j6xRaROD3++XxePTuu+9qxowZcrlcpZp5fdIsFfnvemjLsvTcc8+pXr169uzj8nJ8BINBeTweLV26VN26dZPP55PD4bC3j/Xfmc5Op1N9+vTR7Nmz7Vnt5eVYN7Obq1SpopdeekmxsbEn7Vr0kqrwAWx2uv79++vll1+W2+0mfAsJ4b1796pLly7asWNHuatcg8Gg3G63vvrqK02fPr3Uy26ibcilpaUpJyfnuDcAyguzhnz8+PHasmXLcd8OJ6yi/O/vrFq1qubNm2evky1P4eD3++V2u7Vs2TLdcsstudb1mgbkwIED9eKLL8rtdisQCJSbfdjhcNh1zvTp09W4cWN7X6voPcQKywwbTZo06bgN01WE4egWLVpYhw4dKnDa/4kYgs47MSg5OdnatGlTriG147EfzZkz57gPP5anIei836lr167lanb6sRqCLugzHnnkEXtY3ul0HtOHmXhV0kl+5lTBkCFDcn3nWbNmRbSvmM81EyKP5cMs/7zzzjsr/HnfU+IcsKkUli5dau9MJ3o928nwMAfnTTfdZAduQbNCT0QAh1f+1113XVRLL6KZvBcKhazdu3db1apVsxsBp3IAh3+vt99+u9yE8PEIYHM+2OfzWZ07dz6h50mLet4E2siRIy2/32/NnDkz3+TLaN//WD2aNm1qHTp06Lg1rMsDdwXt1cvpdCo9PV0DBgywz99Yp/ZVN0s8xOh2u7V48WJ16dJFN998c74rhpWH4fL";

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
