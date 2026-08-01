/* ==========================================================================
   BMNT PAYROLL — SUPABASE COMPATIBILITY LAYER
   ========================================================================== */

const SUPABASE_URL = 'https://cvvwmjfzdoukqtbcauet.supabase.cohttps://cvvwmjfzdoukqtbcauet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dndtamZ6ZG91a3F0YmNhdWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzkxMDUsImV4cCI6MjEwMTE1NTEwNX0.rBJA_tAXQ66VLkHT_73SQG55kKZt6yKJwDlh0xqVuQI';

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

/* --------------------------------------------------------------------------
   INITIALIZE SUPABASE
-------------------------------------------------------------------------- */

async function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn("Supabase credentials are missing.");
        return false;
    }

    if (!window.supabase) {
        console.error("Supabase library failed to load.");
        return false;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session?.user) {
        currentUser = session.user;
        await loadProfile(session.user.id);
        return true;
    }

    return true;
}

/* --------------------------------------------------------------------------
   LOGIN
-------------------------------------------------------------------------- */

async function signInWithSupabase(username, password) {

    if (!supabaseClient) {
        return {
            success: false,
            error: "Supabase not initialized."
        };
    }

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("email")
            .eq("username", username)
            .single();

    if (profileError || !profile) {
        return {
            success: false,
            error: "Invalid username."
        };
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: profile.email,
            password: password
        });

    if (error) {
        return {
            success: false,
            error: error.message
        };
    }

    currentUser = data.user;

    await loadProfile(currentUser.id);

    return {
        success: true,
        user: currentUser
    };
}

/* --------------------------------------------------------------------------
   LOGOUT
-------------------------------------------------------------------------- */

async function signOutSupabase() {

    if (!supabaseClient) return;

    await supabaseClient.auth.signOut();

    currentUser = null;
    currentProfile = null;
}

/* --------------------------------------------------------------------------
   LOAD PROFILE
-------------------------------------------------------------------------- */

async function loadProfile(userId) {

    if (!supabaseClient) return null;

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

    if (error) {
        console.error(error);
        return null;
    }

    currentProfile = data;

    return data;
}

/* --------------------------------------------------------------------------
   GENERIC DATABASE HELPERS
-------------------------------------------------------------------------- */

async function fetchAll(table, select = "*") {

    if (!supabaseClient) return [];

    const { data, error } =
        await supabaseClient
            .from(table)
            .select(select);

    if (error) {
        console.error(error);
        return [];
    }

    return data || [];
}

async function upsertRecord(table, payload, idField = null) {

    if (!supabaseClient) return null;

    if (idField && payload[idField]) {

        const { data, error } =
            await supabaseClient
                .from(table)
                .update(payload)
                .eq(idField, payload[idField])
                .select()
                .single();

        if (error) throw error;

        return data;
    }

    const { data, error } =
        await supabaseClient
            .from(table)
            .insert(payload)
            .select()
            .single();

    if (error) throw error;

    return data;
}

/* --------------------------------------------------------------------------
   SYNC LOCAL ARRAYS
-------------------------------------------------------------------------- */

async function syncLocalState() {

    try {

        const [
            employeeRows,
            payslipRows,
            typistRows
        ] = await Promise.all([

            fetchAll("employees"),
            fetchAll("payslips"),
            fetchAll("typists")

        ]);

        employees = employeeRows.map(row => ({
            name: row.name,
            qcid: row.employee_id || row.id,
            designation: row.designation || "",
            department: row.department || "",
            joinDate: row.joining_date || ""
        }));

        payslips = payslipRows.map(row => ({
            empId: row.employee_ref || row.employee_id,
            month: row.month,
            netPay: Number(row.net_salary || 0),
            date: row.generated_at
        }));

        typistEntries = typistRows.map(row => ({
            id: row.id,
            empId: row.employee_ref,
            date: row.created_at?.slice(0,10),
            month: row.month,
            year: row.year,
            work: row.work_count,
            earn: Number(row.amount || 0),
            ded: 0,
            net: Number(row.amount || 0)
        }));

    } catch(err) {

        console.error(err);

    }

}

/* --------------------------------------------------------------------------
   BOOTSTRAP
-------------------------------------------------------------------------- */

async function bootstrapApp() {

    const ready = await initSupabase();

    if (!ready) return;

    await syncLocalState();

    if (typeof initUIElements === "function") initUIElements();
    if (typeof initLogin === "function") initLogin();
    if (typeof updateDashboard === "function") updateDashboard();
    if (typeof renderEmployees === "function") renderEmployees();
    if (typeof renderDocuments === "function") renderDocuments();
    if (typeof refreshDashboard === "function") refreshDashboard();
}