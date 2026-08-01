/* ==========================================================================
   BMNT PAYROLL — SUPABASE COMPATIBILITY LAYER
   ========================================================================== */

const SUPABASE_URL = 'https://cvvwmjfzdoukqtbcauet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dndtamZ6ZG91a3F0YmNhdWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzkxMDUsImV4cCI6MjEwMTE1NTEwNX0.rBJA_tAXQ66VLkHT_73SQG55kKZt6yKJwDlh0xqVuQI';

let supabase = null;
let currentUser = null;
let currentProfile = null;

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured. Running in local fallback mode.');
    return false;
  }

  if (!window.supabase) {
    console.warn('Supabase client library not loaded.');
    return false;
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadProfile(session.user.id);
    return true;
  }

  return false;
}

async function signInWithSupabase(username, password) {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Find the user's email from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'User not found.' };
  }

  // Sign in using email + password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: password
  });

  if (error) {
    return { success: false, error: error.message };
  }

  currentUser = data.user;

  await loadProfile(data.user.id);

  return {
    success: true,
    user: data.user
  };
}

async function signOutSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
}

async function loadProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!error && data) {
    currentProfile = data;
    return data;
  }
  return null;
}

async function fetchAll(table, select = '*') {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select(select);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function upsertRecord(table, payload, idField = null) {
  if (!supabase) return null;
  if (idField && payload[idField]) {
    const { data, error } = await supabase.from(table).update(payload).eq(idField, payload[idField]).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function syncLocalState() {
  try {
    const [employeeRows, payslipRows, typistRows] = await Promise.all([
      fetchAll('employees'),
      fetchAll('payslips'),
      fetchAll('typists')
    ]);

    employees = employeeRows.map(row => ({
      name: row.name,
      qcid: row.employee_id || row.id,
      designation: row.designation || '',
      department: row.department || '',
      joinDate: row.joining_date || ''
    }));

    payslips = payslipRows.map(row => ({
      empId: row.employee_ref || row.employee_id || '',
      month: row.month || '',
      netPay: Number(row.net_salary || 0),
      date: row.generated_at || new Date().toISOString()
    }));

    typistEntries = typistRows.map(row => ({
      id: row.id,
      empId: row.employee_ref || '',
      date: row.created_at ? row.created_at.slice(0, 10) : '',
      month: row.month || '',
      year: row.year || '',
      work: row.work_count || 0,
      earn: Number(row.amount || 0),
      ded: 0,
      net: Number(row.amount || 0)
    }));
  } catch (err) {
    console.error('Supabase sync failed', err);
  }
}

async function bootstrapApp() {
  const ready = await initSupabase();
  if (ready) {
    await syncLocalState();
    if (typeof initUIElements === 'function') initUIElements();
    if (typeof initLogin === 'function') initLogin();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderEmployees === 'function') renderEmployees();
    if (typeof renderDocuments === 'function') renderDocuments();
    if (typeof refreshDashboard === 'function') refreshDashboard();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrapApp();
});
