/* ==========================================================================
   BMNT PAYROLL — PDF GENERATION MODULE (SINGLE PAYSLIP & TYPIST REPORTS)
   ========================================================================== */
function populatePDFTemplate(empData, payData) {
  document.getElementById('ptName').innerText = empData.name;
  document.getElementById('ptId').innerText = empData.qcid;
  document.getElementById('ptDesig').innerText = empData.designation;
  document.getElementById('ptDept').innerText = empData.department;
  document.getElementById('ptJoin').innerText = empData.joinDate;
  document.getElementById('ptPeriod').innerText = payData.month;
  document.getElementById('ptDate').innerText = new Date().toISOString().split('T')[0];

  document.getElementById('ptWsAcad').innerText = payData.wsAcad; document.getElementById('ptWsDept').innerText = payData.wsDept;
  document.getElementById('ptWsPT').innerText = payData.wsPT; document.getElementById('ptWsUT').innerText = payData.wsUT;
  document.getElementById('ptWsOth1').innerText = payData.wsOth1; document.getElementById('ptWsOth2').innerText = payData.wsOth2;

  document.getElementById('ptEarn1').innerText = '₹' + payData.e1; document.getElementById('ptEarn2').innerText = '₹' + payData.e2;
  document.getElementById('ptEarn3').innerText = '₹' + payData.e3; document.getElementById('ptEarn4').innerText = '₹' + payData.e4;
  document.getElementById('ptEarn5').innerText = '₹' + payData.e5; document.getElementById('ptEarn6').innerText = '₹' + payData.e6;
  document.getElementById('ptGross').innerText = '₹' + payData.gross; document.getElementById('ptNetGross').innerText = '₹' + payData.gross;

  document.getElementById('ptDed1').innerText = '₹' + payData.d1; document.getElementById('ptDed2').innerText = '₹' + payData.d2;
  document.getElementById('ptDed3').innerText = '₹' + payData.d3; document.getElementById('ptDed4').innerText = '₹' + payData.d4;
  document.getElementById('ptDed5').innerText = '₹' + payData.d5; document.getElementById('ptDed6').innerText = '₹' + payData.d6;
  document.getElementById('ptTotalDed').innerText = '₹' + payData.totalDed; document.getElementById('ptNetDed').innerText = '₹' + payData.totalDed;
  document.getElementById('ptNetPay').innerText = '₹' + payData.netPay;
}

async function renderPDF() {
  const template = document.getElementById('print-template');
  document.getElementById('pdf-wrapper').style.left = '0';
  document.getElementById('pdf-wrapper').style.top = '0';
  document.getElementById('pdf-wrapper').style.zIndex = '-1';
  const canvas = await html2canvas(template, { scale: 2 });
  document.getElementById('pdf-wrapper').style.left = '-9999px';
  document.getElementById('pdf-wrapper').style.top = '-9999px';

  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  return pdf;
}

async function generateSinglePDF() {
  const empIndex = document.getElementById('empSelect').value;
  if (empIndex === "") { showToast('Select an employee first.', 'error'); return; }
  const btn = document.querySelector('#finalAction .btn');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<span class="spinner"></span> Generating...';
    btn.disabled = true;
  }
  const emp = employees[empIndex];
  const payData = getPayslipFormData();
  payslips.push({ empId: emp.qcid, month: payData.month, netPay: payData.netPay, date: new Date().toISOString() });
  try {
    await upsertRecord('payslips', {
      employee_ref: emp.qcid,
      month: payData.month,
      year: new Date().getFullYear().toString(),
      gross_salary: Number(payData.gross || 0),
      allowances: Number(payData.e1 || 0),
      deductions: Number(payData.totalDed || 0),
      net_salary: Number(payData.netPay || 0),
      generated_by: currentUser?.id || null,
      pdf_url: null,
      remarks: 'Generated via app'
    });
  } catch (err) {
    console.error(err);
  }
  await syncLocalState();
  updateDashboard();
  populatePDFTemplate(emp, payData);
  const pdf = await renderPDF();
  const filename = `Payslip_${emp.name.replace(/\s+/g, '_')}_${payData.month}.pdf`;
  const blob = pdf.output('blob');

  await saveDocumentToRepo({ name: filename, category: 'Payslip', employeeName: emp.name, employeeId: emp.qcid, month: payData.month, blob });
  await refreshDashboard();
  if (typeof renderDocuments === 'function') renderDocuments();

  if (btn) {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
  openDocReadyModal(blob, filename);
}

async function generateIndividualTypistPDF() {
  const empIndex = document.getElementById('twSelect').value;
  if (empIndex === "") { showToast('Please select a typist first.', 'error'); return; }

  const emp = employees[empIndex];
  const filterMonth = document.getElementById('twFilterMonth').value;
  const filterYear = document.getElementById('twFilterYear').value.toString();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.addImage(`data:image/png;base64,${LOGO_BLACK_B64}`, 'PNG', 14, 10, 16, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 91, 92);
  doc.text("BRAINYMEDIC EDUVERSE PVT LTD", 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Individual Typist Work Report", 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Typist Name: ${emp.name}`, 14, 40);
  doc.text(`Employee ID: ${emp.qcid}`, 14, 45);
  doc.text(`Department: ${emp.department}`, 14, 50);

  doc.text(`Report Period: ${filterMonth} ${filterYear}`, 130, 40);
  doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 130, 45);

  let filtered = typistEntries
    .filter(e => e.empId === emp.qcid && e.month === filterMonth && e.year === filterYear)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let tEarn = 0, tDed = 0, tNet = 0;
  const tableData = filtered.map(e => {
    tEarn += e.earn; tDed += e.ded; tNet += e.net;
    return [e.date, e.work, `${e.earn.toFixed(2)}`, `${e.ded.toFixed(2)}`, `${e.net.toFixed(2)}`];
  });

  tableData.push([
    { content: 'TOTALS', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 91, 92] } },
    { content: `${tEarn.toFixed(2)}`, styles: { fontStyle: 'bold' } },
    { content: `${tDed.toFixed(2)}`, styles: { fontStyle: 'bold' } },
    { content: `${tNet.toFixed(2)}`, styles: { fontStyle: 'bold' } }
  ]);

  doc.autoTable({
    startY: 55,
    head: [['Date', 'Work Done', 'Earnings (INR)', 'Deductions (INR)', 'Net Salary (INR)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 91, 92], textColor: 255, halign: 'center' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 9 },
    showHead: 'everyPage'
  });

  const filename = `Typist_Report_${emp.name.replace(/\s+/g, '_')}_${filterMonth}_${filterYear}.pdf`;
  const blob = doc.output('blob');
  await saveDocumentToRepo({ name: filename, category: 'Typist Report', employeeName: emp.name, employeeId: emp.qcid, month: `${filterMonth} ${filterYear}`, blob });
  await refreshDashboard();
  if (typeof renderDocuments === 'function') renderDocuments();
  openDocReadyModal(blob, filename);
}

async function generateMonthlyTypistPDF() {
  const filterMonth = document.getElementById('twFilterMonth').value;
  const filterYear = document.getElementById('twFilterYear').value.toString();

  const typistEmps = employees.filter(emp => emp.department.trim().toLowerCase() === 'typist cell');
  if (typistEmps.length === 0) { showToast('No typists found in database.', 'error'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.addImage(`data:image/png;base64,${LOGO_BLACK_B64}`, 'PNG', 14, 10, 16, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 91, 92);
  doc.text("BRAINYMEDIC EDUVERSE PVT LTD", 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Monthly Typist Cell Report", 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Period: ${filterMonth} ${filterYear}`, 14, 40);
  doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 145, 40);

  const tableData = [];
  let grandEarn = 0, grandDed = 0, grandNet = 0;

  typistEmps.forEach(emp => {
    const empEntries = typistEntries.filter(e => e.empId === emp.qcid && e.month === filterMonth && e.year === filterYear);
    if (empEntries.length > 0) {
      let eEarn = 0, eDed = 0, eNet = 0;
      empEntries.forEach(entry => { eEarn += entry.earn; eDed += entry.ded; eNet += entry.net; });
      grandEarn += eEarn; grandDed += eDed; grandNet += eNet;
      tableData.push([emp.qcid, emp.name, empEntries.length.toString(), `${eEarn.toFixed(2)}`, `${eDed.toFixed(2)}`, `${eNet.toFixed(2)}`]);
    }
  });

  if (tableData.length === 0) {
    showToast(`No work entries found for Typist Cell in ${filterMonth} ${filterYear}.`, 'error');
    return;
  }

  tableData.push([
    { content: 'GRAND TOTALS', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 91, 92] } },
    { content: `${grandEarn.toFixed(2)}`, styles: { fontStyle: 'bold' } },
    { content: `${grandDed.toFixed(2)}`, styles: { fontStyle: 'bold' } },
    { content: `${grandNet.toFixed(2)}`, styles: { fontStyle: 'bold' } }
  ]);

  doc.autoTable({
    startY: 45,
    head: [['Employee ID', 'Typist Name', 'Entries Count', 'Total Earnings (INR)', 'Total Deductions (INR)', 'Total Net Salary (INR)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 91, 92], textColor: 255, halign: 'center' },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right', fontStyle: 'bold' } },
    styles: { fontSize: 9 },
    showHead: 'everyPage'
  });

  const filename = `Monthly_Typist_Cell_Report_${filterMonth}_${filterYear}.pdf`;
  const blob = doc.output('blob');
  await saveDocumentToRepo({ name: filename, category: 'Monthly Report', employeeName: '', employeeId: '', month: `${filterMonth} ${filterYear}`, blob });
  await refreshDashboard();
  if (typeof renderDocuments === 'function') renderDocuments();
  openDocReadyModal(blob, filename);
}
