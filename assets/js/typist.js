/* ==========================================================================
   BMNT PAYROLL — TYPIST WORK & PAYROLL MODULE
   ========================================================================== */
function loadTypistDashboard() {
  const index = document.getElementById('twSelect').value;
  const dash = document.getElementById('typistDashboard');
  if (!dash) return;

  if (index === "") { dash.style.display = 'none'; return; }

  dash.style.display = 'block';
  const emp = employees[index];
  const filterMonth = document.getElementById('twFilterMonth').value;
  const filterYear = document.getElementById('twFilterYear').value;

  document.getElementById('tdId').innerText = emp.qcid;
  document.getElementById('tdName').innerText = emp.name;
  document.getElementById('tdDept').innerText = emp.department;
  document.getElementById('tdPeriod').innerText = `${filterMonth} ${filterYear}`;

  resetTweForm();
  renderTypistTable();
}

async function saveTypistWork(e) {
  e.preventDefault();
  const index = document.getElementById('tweIndex').value;
  const empIndex = document.getElementById('twSelect').value;
  const emp = employees[empIndex];

  const filterMonth = document.getElementById('twFilterMonth').value;
  const filterYear = document.getElementById('twFilterYear').value;
  const dateStr = document.getElementById('tweDate').value;

  const entry = {
    id: index !== "-1" ? typistEntries[index].id : Date.now().toString(),
    empId: emp.qcid,
    date: dateStr,
    month: filterMonth,
    year: filterYear,
    work: document.getElementById('tweWork').value,
    earn: parseFloat(document.getElementById('tweEarn').value) || 0,
    ded: parseFloat(document.getElementById('tweDed').value) || 0,
    net: parseFloat(document.getElementById('tweNet').value) || 0
  };

  if (index === "-1") typistEntries.push(entry);
  else typistEntries[index] = entry;

  try {
    await upsertRecord('typists', {
      id: entry.id,
      employee_ref: emp.qcid,
      month: filterMonth,
      year: filterYear,
      work_count: Number(entry.work) || 0,
      rate: 0,
      amount: entry.net,
      created_by: currentUser?.id || null
    }, 'id');
  } catch (err) {
    console.error(err);
  }
  resetTweForm();
  await syncLocalState();
  renderTypistTable();
  updateDashboard();
  showToast('Work entry saved.', 'success');
}

function editTypistEntry(index) {
  const entry = typistEntries[index];
  document.getElementById('tweIndex').value = index;
  document.getElementById('tweDate').value = entry.date;
  document.getElementById('tweWork').value = entry.work;
  document.getElementById('tweEarn').value = entry.earn;
  document.getElementById('tweDed').value = entry.ded;
  calcTweNet();
  const form = document.getElementById('typistEntryForm');
  if (form) form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteTypistEntry(index) {
  const ok = await confirmAction('Delete this work entry? This cannot be undone.', 'Delete Entry');
  if (ok) {
    const entry = typistEntries[index];
    typistEntries.splice(index, 1);
    try {
      await supabase?.from('typists').delete().eq('id', entry.id);
    } catch (err) {
      console.error(err);
    }
    await syncLocalState();
    renderTypistTable();
    updateDashboard();
    showToast('Entry deleted.', 'success');
  }
}

function renderTypistTable() {
  const tbody = document.getElementById('twTableBody');
  const empIndex = document.getElementById('twSelect').value;
  if (!tbody || empIndex === "") return;

  const emp = employees[empIndex];
  const filterMonth = document.getElementById('twFilterMonth').value;
  const filterYear = document.getElementById('twFilterYear').value.toString();

  tbody.innerHTML = '';
  let totalEarn = 0, totalDed = 0, totalNet = 0;

  let filtered = typistEntries
    .map((entry, index) => ({ ...entry, originalIndex: index }))
    .filter(e => e.empId === emp.qcid && e.month === filterMonth && e.year === filterYear)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:34px 10px;"><div class="es-icon"><i class="fa-solid fa-keyboard"></i></div><h3>No work entries yet</h3><p>Add the first entry for ${emp.name} in ${filterMonth} ${filterYear} using the form above.</p></div></td></tr>`;
  }

  filtered.forEach(entry => {
    totalEarn += entry.earn; totalDed += entry.ded; totalNet += entry.net;
    tbody.innerHTML += `
      <tr>
        <td class="cell-mono">${entry.date}</td>
        <td>${entry.month} ${entry.year}</td>
        <td>${entry.work}</td>
        <td class="cell-mono">₹${entry.earn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="cell-mono">₹${entry.ded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="cell-mono"><strong>₹${entry.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
        <td>
          <button class="btn btn-secondary btn-icon-only" onclick="editTypistEntry(${entry.originalIndex})" data-tip="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-icon-only" onclick="deleteTypistEntry(${entry.originalIndex})" data-tip="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  const totEarnEl = document.getElementById('twTotEarn');
  const totDedEl = document.getElementById('twTotDed');
  const totNetEl = document.getElementById('twTotNet');
  if (totEarnEl) totEarnEl.innerText = '₹' + totalEarn.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (totDedEl) totDedEl.innerText = '₹' + totalDed.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  if (totNetEl) totNetEl.innerText = '₹' + totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}
