let bmntDB = null;

function openDocDB() {
    return new Promise((resolve, reject) => {
        if (bmntDB) return resolve(bmntDB);

        const req = indexedDB.open('BMNTDocumentsDB', 1);

        req.onupgradeneeded = (e) => {
            const db = e.target.result;

            if (!db.objectStoreNames.contains('documents')) {
                const store = db.createObjectStore('documents', {
                    keyPath: 'id',
                    autoIncrement: true
                });

                store.createIndex('createdAt', 'createdAt');
                store.createIndex('category', 'category');
            }
        };

        req.onsuccess = (e) => {
            bmntDB = e.target.result;
            resolve(bmntDB);
        };

        req.onerror = (e) => reject(e);
    });
}

async function saveDocumentToRepo({
    name,
    category,
    employeeName = '',
    employeeId = '',
    month = '',
    blob
}) {
    const db = await openDocDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');

        const record = {
            name,
            category,
            employeeName,
            employeeId,
            month,
            size: blob.size,
            createdAt: new Date().toISOString(),
            blob
        };

        const req = store.add(record);

        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
}

async function getAllDocuments() {
    const db = await openDocDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('documents', 'readonly');
        const req = tx.objectStore('documents').getAll();

        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
}

async function getDocument(id) {
    const db = await openDocDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('documents', 'readonly');
        const req = tx.objectStore('documents').get(id);

        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
}

async function updateDocumentName(id, newName) {
    const db = await openDocDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');

        const getReq = store.get(id);

        getReq.onsuccess = () => {
            const rec = getReq.result;

            if (!rec) return resolve(false);

            rec.name = newName;

            const putReq = store.put(rec);

            putReq.onsuccess = () => resolve(true);
            putReq.onerror = (e) => reject(e);
        };

        getReq.onerror = (e) => reject(e);
    });
}

async function deleteDocumentFromRepo(id) {
    const db = await openDocDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction('documents', 'readwrite');
        const req = tx.objectStore('documents').delete(id);

        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
    });
}

function fmtBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function saveBlobToComputer(blob, suggestedName) {
    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: [
                    {
                        description: 'PDF Document',
                        accept: {
                            'application/pdf': ['.pdf']
                        }
                    }
                ]
            });

            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            showToast('Saved to your chosen folder.', 'success');
            return;
        }
    } catch (err) {
        if (err && err.name === 'AbortError') return;
    }

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 4000);

    showToast('Download started.', 'success');
}

let pendingDocReady = null;

function openDocReadyModal(blob, filename) {
    pendingDocReady = { blob, filename };

    document.getElementById('docReadyName').innerText = filename;
    document.getElementById('docReadySize').innerText =
        fmtBytes(blob.size) + ' · PDF Document';

    openModal('docReadyModal');
}