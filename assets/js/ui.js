/* ==========================================================================
   BMNT PAYROLL — UI INTERACTIONS, NAVIGATION, THEME & LOGIN
   ========================================================================== */
let navLinks = [];
let sections = [];
let themeToggle = null;

function initUIElements() {
  navLinks = document.querySelectorAll('.nav-links li[data-target]');
  sections = document.querySelectorAll('.page-section');
  themeToggle = document.getElementById('themeToggle');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      goToSection(link.getAttribute('data-target'));
    });
  });

  const quickAdd = document.getElementById('quickAddBtn');
  if (quickAdd) {
    quickAdd.addEventListener('click', () => { goToSection('employees'); openEmpModal(); });
  }

  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => goToSection('dashboard'));
  }

  const mobileNavToggle = document.getElementById('mobileNavToggle');
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('mobile-open'));
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      document.body.dataset.theme = isDark ? 'dark' : 'light';
      themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>' : '<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>';
      if (window._payrollChart) renderPayrollChart();
    });
  }

  initTheme();
}

function goToSection(target) {
  navLinks = document.querySelectorAll('.nav-links li[data-target]');
  sections = document.querySelectorAll('.page-section');
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-target') === target));
  sections.forEach(sec => sec.classList.toggle('active', sec.id === target));
  const titles = { dashboard: 'Dashboard', employees: 'Employees', payslip: 'Generate Payslip', 'typist-work': 'Typist Work & Payroll', documents: 'Documents' };
  const breadcrumb = document.getElementById('breadcrumbTitle');
  if (breadcrumb) breadcrumb.innerText = titles[target] || target;
  if (target === 'documents' && typeof renderDocuments === 'function') renderDocuments();
  if (target === 'dashboard' && typeof refreshDashboard === 'function') refreshDashboard();
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
}

function initTheme() {
  themeToggle = document.getElementById('themeToggle');
  const storedTheme = document.body.dataset.theme || 'light';
  if (storedTheme === 'dark') {
    document.body.classList.add('dark');
    if (themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
  }
}

function initSidebarCollapse() {
  const btn = document.getElementById('sidebarCollapseBtn');
  const sidebar = document.getElementById('sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      document.body.dataset.sidebarCollapsed = sidebar.classList.contains('collapsed') ? '1' : '0';
    });
    if (document.body.dataset.sidebarCollapsed === '1') sidebar.classList.add('collapsed');
  }
}

function initLogin() {
  const screen = document.getElementById('loginScreen');
  const storedName = sessionStorage.getItem('bmnt_user_name');
  if (currentProfile && currentProfile.name) {
    applyUserChip(currentProfile.name);
    if (screen) screen.classList.add('hidden');
    return;
  }
  if (storedName) document.getElementById('loginName').value = storedName;
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const loginName = document.getElementById('loginName').value.trim() || 'Staff';
      const password = document.getElementById('loginPass').value.trim();
      const btnText = document.getElementById('loginBtnText');
      btnText.innerHTML = '<span class="spinner" style="display:inline-block;border-color:rgba(255,255,255,.4);border-top-color:#fff;"></span>';
      const result = await signInWithSupabase(loginName, password);
      if (result.success) {
        sessionStorage.setItem('bmnt_user_name', loginName);
        sessionStorage.setItem('bmnt_signed_in', '1');
        await loadProfile(currentUser?.id || '');
        applyUserChip(currentProfile?.name || loginName);
        if (screen) screen.classList.add('hidden');
        showToast('Signed in successfully.', 'success');
      } else {
        showToast(result.error || 'Unable to sign in.', 'error');
      }
      btnText.innerText = 'Sign In';
    });
  }
}

function applyUserChip(name) {
  const chipName = document.getElementById('userChipName');
  const userAvatar = document.getElementById('userAvatar');
  const designationEl = document.getElementById('userChipDesignation');
  if (chipName) chipName.innerText = name || 'User';
  if (userAvatar) userAvatar.innerText = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
  if (designationEl) designationEl.innerText = currentProfile?.designation || 'User';
}

async function handleLogout() {
  try {
    await signOutSupabase();
    sessionStorage.clear();
    document.body.classList.remove('dark');
    document.body.dataset.theme = 'light';
    showToast('Logged out successfully.', 'success');
    window.location.href = 'index.html';
  } catch (err) {
    showToast('Unable to log out right now.', 'error');
  }
}

function openProfilePanel() {
  showProfileModal();
}

function showProfileModal() {
  const profileModal = document.getElementById('profileModal');
  const profileName = document.getElementById('profileName');
  const profileDesignation = document.getElementById('profileDesignation');
  const profileRole = document.getElementById('profileRole');
  const profileEmployeeId = document.getElementById('profileEmployeeId');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const profileLastLogin = document.getElementById('profileLastLogin');
  const profileCreatedAt = document.getElementById('profileCreatedAt');
  const profileAvatar = document.getElementById('profileAvatar');

  if (profileName) profileName.innerText = currentProfile?.name || 'User';
  if (profileDesignation) profileDesignation.innerText = currentProfile?.designation || 'User';
  if (profileRole) profileRole.innerText = currentProfile?.role || '-';
  if (profileEmployeeId) profileEmployeeId.innerText = currentProfile?.employee_id || '-';
  if (profileEmail) profileEmail.innerText = currentProfile?.email || '-';
  if (profilePhone) profilePhone.innerText = currentProfile?.phone || '-';
  if (profileLastLogin) profileLastLogin.innerText = currentProfile?.last_login ? new Date(currentProfile.last_login).toLocaleString() : '-';
  if (profileCreatedAt) profileCreatedAt.innerText = currentProfile?.created_at ? new Date(currentProfile.created_at).toLocaleString() : '-';
  if (profileAvatar) profileAvatar.innerText = (currentProfile?.name || 'U').trim().charAt(0).toUpperCase() || 'U';

  if (profileModal) openModal('profileModal');
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) searchInput.focus();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
      const results = document.getElementById('globalSearchResults');
      if (results) results.classList.remove('active');
    }
  });
}
