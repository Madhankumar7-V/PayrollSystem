/* ==========================================================================
   BMNT PAYROLL — EMPLOYEE MANAGEMENT MODULE
   ========================================================================== */
let empSortKey = 'name', empSortDir = 1, empPage = 1;
const EMP_PAGE_SIZE = 8;

function openEmpModal(index = -1) {
  openModal('empModal');
  const form = document.getElementById('empForm');
  if (form) form.reset();
  document.getElementById('empIndex').value = index;
  if (index > -1) {
    document.getElementById('modalTitle').innerText = 'Edit Employee';
    const emp = employees[index];
    document.getElementById('fName').value = emp.name;
    document.getElementById('fId').value = emp.qcid;
    document.getElementById('fDesig').value = emp.designation;
    document.getElementById('fDept').value = emp.department;
    document.getElementById('fJoin').value = emp.joinDate;
  } else {
    document.getElementById('modalTitle').innerText = 'Add Employee';
  }
}

function closeEmpModal() {
  closeModal('empModal');
}

async function saveEmployee(e) {
  e.preventDefault();
  const index = document.getElementById('empIndex').value;
  const empData = {
    name: document.getElementById('fName').value,
    qcid: document.getElementById('fId').value,
    designation: document.getElementById('fDesig').value,
    department: document.getElementById('fDept').value,
    joinDate: document.getElementById('fJoin').value
  };
  const isEdit = index != -1;
  if (!isEdit) employees.push(empData);
  else employees[index] = empData;
  try {
    await upsertRecord('employees', {
      employee_id: empData.qcid,
      name: empData.name,
      department: empData.department,
      designation: empData.designation,
      joining_date: empData.joinDate,
      created_by: currentUser?.id || null
    }, isEdit ? 'employee_id' : null);
  } catch (err) {
    console.error(err);
  }
  closeEmpModal();
  await syncLocalState();
  renderEmployees();
  populateEmployeeDropdowns();
  updateDashboard();
  showToast(isEdit ? 'Employee updated.' : 'Employee added.', 'success');
}

async function deleteEmployee(index) {
  const emp = employees[index];
  const ok = await confirmAction(`Delete ${emp.name} (${emp.qcid})? This cannot be undone.`, 'Delete Employee');
  if (ok) {
    employees.splice(index, 1);
    try {
      await supabase?.from('employees').delete().eq('employee_id', emp.qcid);
    } catch (err) {
      console.error(err);
    }
    await syncLocalState();
    renderEmployees();
    populateEmployeeDropdowns();
    updateDashboard();
    showToast('Employee deleted.', 'success');
  }
}

function sortEmpTable(key) {
  if (empSortKey === key) empSortDir *= -1;
  else { empSortKey = key; empSortDir = 1; }
  renderEmployees();
}

function renderEmployees() {
  const tbody = document.getElementById('empTableBody');
  if (!tbody) return;
  const searchInput = document.getElementById('searchEmp');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  let filtered = employees.map((emp, index) => ({ ...emp, originalIndex: index }))
    .filter(emp => emp.name.toLowerCase().includes(searchTerm) || emp.qcid.toLowerCase().includes(searchTerm));

  filtered.sort((a, b) => {
    const av = (a[empSortKey] || '').toString().toLowerCase();
    const bv = (b[empSortKey] || '').toString().toLowerCase();
    return av > bv ? empSortDir : av < bv ? -empSortDir : 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / EMP_PAGE_SIZE));
  if (empPage > totalPages) empPage = totalPages;
  const pageItems = filtered.slice((empPage - 1) * EMP_PAGE_SIZE, empPage * EMP_PAGE_SIZE);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="es-icon"><i class="fa-solid fa-user-slash"></i></div><h3>No employees found</h3><p>Try a different search term, or add a new employee to get started.</p><button class="btn btn-primary btn-sm" onclick="openEmpModal()"><i class="fa-solid fa-plus"></i> Add Employee</button></div></td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(emp => `
      <tr>
        <td><span class="avatar-initial">${initials(emp.name)}</span>${emp.name}</td>
        <td class="cell-mono">${emp.qcid}</td>
        <td>${emp.designation}</td>
        <td><span class="badge ${emp.department.trim().toLowerCase() === 'typist cell' ? 'badge-gold' : 'badge-teal'}">${emp.department}</span></td>
        <td class="cell-mono">${emp.joinDate}</td>
        <td>
          <button class="btn btn-secondary btn-icon-only" onclick="openEmpModal(${emp.originalIndex})" data-tip="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-icon-only" onclick="deleteEmployee(${emp.originalIndex})" data-tip="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  const countEl = document.getElementById('empTableCount');
  if (countEl) countEl.innerText = `${filtered.length} employee${filtered.length !== 1 ? 's' : ''}`;
  const pag = document.getElementById('empPagination');
  if (pag) {
    let pagHtml = `<button ${empPage === 1 ? 'disabled' : ''} onclick="empPage--;renderEmployees()"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) pagHtml += `<button class="${p === empPage ? 'active' : ''}" onclick="empPage=${p};renderEmployees()">${p}</button>`;
    pagHtml += `<button ${empPage === totalPages ? 'disabled' : ''} onclick="empPage++;renderEmployees()"><i class="fa-solid fa-chevron-right"></i></button>`;
    pag.innerHTML = pagHtml;
  }
}

function populateEmployeeDropdowns() {
  const regularSelect = document.getElementById('empSelect');
  const typistSelect = document.getElementById('twSelect');
  if (!regularSelect || !typistSelect) return;

  regularSelect.innerHTML = '<option value="">-- Choose Employee --</option>';
  typistSelect.innerHTML = '<option value="">-- Choose Typist --</option>';

  employees.forEach((emp, index) => {
    const isTypist = emp.department.trim().toLowerCase() === 'typist cell';
    const optionHTML = `<option value="${index}">${emp.name} (${emp.qcid})</option>`;
    if (isTypist) typistSelect.innerHTML += optionHTML;
    else regularSelect.innerHTML += optionHTML;
  });
}
