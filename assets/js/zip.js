/* ==========================================================================
   BMNT PAYROLL — BULK ZIP EXPORT MODULE
   ========================================================================== */
async function generateBulkPDF() {
  const empList = employees.filter(e => e.department.trim().toLowerCase() !== 'typist cell');
  if (empList.length === 0) { showToast('No standard employees found.', 'error'); return; }
  const month = document.getElementById('bulkMonth').value;
  if (!month) { showToast('Please select a month.', 'error'); return; }
  const zip = new JSZip();
  const folder = zip.folder(`Payslips_${month}`);
  const btn = document.querySelector('.header-actions .btn-primary');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> Zipping...';
    btn.disabled = true;
  }

  const emptyPayData = { month: month, wsAcad: 0, wsDept: 0, wsPT: 0, wsUT: 0, wsOth1: 0, wsOth2: 0, e1: 0, e2: 0, e3: 0, e4: 0, e5: 0, e6: 0, gross: 0, d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, totalDed: 0, netPay: 0 };
  for (let emp of empList) {
    populatePDFTemplate(emp, emptyPayData);
    const pdf = await renderPDF();
    const pdfBlob = pdf.output('blob');
    const fname = `Payslip_${emp.name.replace(/\s+/g, '_')}_${month}.pdf`;
    folder.file(fname, pdfBlob);
    await saveDocumentToRepo({ name: fname, category: 'Payslip', employeeName: emp.name, employeeId: emp.qcid, month: month, blob: pdfBlob });
  }
  zip.generateAsync({ type: "blob" }).then(async function (content) {
    await saveBlobToComputer(content, `BrainyMedic_Payslips_${month}.zip`).catch(() => { });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `BrainyMedic_Payslips_${month}.zip`;
    if (!window.showSaveFilePicker) { link.click(); }
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
    await refreshDashboard();
    if (typeof renderDocuments === 'function') renderDocuments();
    showToast(`Bulk export complete — ${empList.length} payslips saved to Documents.`, 'success');
  });
}
