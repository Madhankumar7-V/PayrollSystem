/* ==========================================================================
   BMNT PAYROLL — REGULAR PAYSLIP CALCULATION LOGIC
   ========================================================================== */
function populateEmpDetails() {
  const index = document.getElementById('empSelect').value;
  const grid = document.getElementById('empDetailsGrid');
  const calc = document.getElementById('calcGrid');
  const action = document.getElementById('finalAction');
  if (index === "") {
    if (grid) grid.style.display = 'none';
    if (calc) calc.style.display = 'none';
    if (action) action.style.display = 'none';
    return;
  }

  const emp = employees[index];
  document.getElementById('psName').value = emp.name;
  document.getElementById('psId').value = emp.qcid;
  document.getElementById('psDesig').value = emp.designation;
  document.getElementById('psDept').value = emp.department;
  document.getElementById('psJoin').value = emp.joinDate;

  const now = new Date();
  document.getElementById('psMonth').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (grid) grid.style.display = 'grid';
  if (calc) calc.style.display = 'grid';
  if (action) action.style.display = 'flex';
  calculateTotals();
}

function attachCalculationListeners() {
  const inputs = document.querySelectorAll('.earn-input, .ded-input');
  inputs.forEach(input => input.addEventListener('input', calculateTotals));
}

function calculateTotals() {
  const e1 = parseFloat(document.getElementById('earnBaseIF').value) || 0;
  const e2 = parseFloat(document.getElementById('earnBasePT').value) || 0;
  const e3 = parseFloat(document.getElementById('earnBaseUT').value) || 0;
  const e4 = parseFloat(document.getElementById('earnIncPT').value) || 0;
  const e5 = parseFloat(document.getElementById('earnIncUT').value) || 0;
  const e6 = parseFloat(document.getElementById('earnAddt').value) || 0;
  const gross = e1 + e2 + e3 + e4 + e5 + e6;

  const d1 = parseFloat(document.getElementById('dedAcc').value) || 0;
  const d2 = parseFloat(document.getElementById('dedProof').value) || 0;
  const d3 = parseFloat(document.getElementById('dedDead').value) || 0;
  const d4 = parseFloat(document.getElementById('dedSOP').value) || 0;
  const d5 = parseFloat(document.getElementById('dedAdv').value) || 0;
  const d6 = parseFloat(document.getElementById('dedOth').value) || 0;
  const totalDed = d1 + d2 + d3 + d4 + d5 + d6;

  const netPay = gross - totalDed;
  const txtGross = document.getElementById('txtGross');
  const txtTotalDed = document.getElementById('txtTotalDed');
  const txtNetPay = document.getElementById('txtNetPay');
  if (txtGross) txtGross.innerText = gross.toLocaleString('en-IN');
  if (txtTotalDed) txtTotalDed.innerText = totalDed.toLocaleString('en-IN');
  if (txtNetPay) txtNetPay.innerText = netPay.toLocaleString('en-IN');
}

function getPayslipFormData() {
  const gross = parseFloat(document.getElementById('txtGross').innerText.replace(/,/g, '')) || 0;
  const totalDed = parseFloat(document.getElementById('txtTotalDed').innerText.replace(/,/g, '')) || 0;
  return {
    month: document.getElementById('psMonth').value,
    wsAcad: document.getElementById('wsAcad').value,
    wsDept: document.getElementById('wsDept').value,
    wsPT: document.getElementById('wsPT').value,
    wsUT: document.getElementById('wsUT').value,
    wsOth1: document.getElementById('wsOth1').value,
    wsOth2: document.getElementById('wsOth2').value,
    e1: document.getElementById('earnBaseIF').value,
    e2: document.getElementById('earnBasePT').value,
    e3: document.getElementById('earnBaseUT').value,
    e4: document.getElementById('earnIncPT').value,
    e5: document.getElementById('earnIncUT').value,
    e6: document.getElementById('earnAddt').value,
    gross: gross,
    d1: document.getElementById('dedAcc').value,
    d2: document.getElementById('dedProof').value,
    d3: document.getElementById('dedDead').value,
    d4: document.getElementById('dedSOP').value,
    d5: document.getElementById('dedAdv').value,
    d6: document.getElementById('dedOth').value,
    totalDed: totalDed,
    netPay: gross - totalDed
  };
}
