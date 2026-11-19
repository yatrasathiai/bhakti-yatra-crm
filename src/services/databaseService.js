/**
 * ============================================================================
 * YATRA SAATHI — DATABASE SERVICE (Supabase PostgreSQL + Local Storage)
 * Dual-sync resilient storage: Connects to Supabase Cloud when configured,
 * with automatic fallback and caching in localStorage.
 * ============================================================================
 */
import { createClient } from "@supabase/supabase-js";

const LOCAL_KEY = "yatra_crm_leads";

const SEED_LEADS = [
  {
    id: "seed-1",
    name: "Ramesh Sharma",
    phone: "9876543210",
    destination: "Kedarnath",
    travellers: "4",
    preferred_date: "15 May",
    status: "new",
    notes: "Bujurgon ke liye palki suvidha chahiye",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "seed-2",
    name: "Pooja Verma",
    phone: "9123456780",
    destination: "Ayodhya",
    travellers: "2",
    preferred_date: "Agle hafte",
    status: "contacted",
    notes: "Aarti pass aur VIP darshan ki details maangi hain",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "seed-3",
    name: "Anil Gupta",
    phone: "9988776655",
    destination: "Vaishno Devi",
    travellers: "6",
    preferred_date: "June",
    status: "booked",
    notes: "Advance confirm, Katra cab & hotel reserved",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

let cachedClient = null;
let cachedUrl = "";
let cachedKey = "";

/**
 * Get active Supabase client (from localStorage config or .env)
 */
export function getSupabase() {
  const url =
    localStorage.getItem("yatra_supabase_url") ||
    import.meta.env.VITE_SUPABASE_URL ||
    "";
  const key =
    localStorage.getItem("yatra_supabase_key") ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) return null;

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedUrl = url;
    cachedKey = key;
    cachedClient = createClient(url, key);
    return cachedClient;
  } catch (err) {
    console.error("Supabase client creation error:", err);
    return null;
  }
}

/**
 * Check if cloud sync is currently configured
 */
export function getStorageInfo() {
  const client = getSupabase();
  const url =
    localStorage.getItem("yatra_supabase_url") ||
    import.meta.env.VITE_SUPABASE_URL ||
    "";
  return {
    isCloud: !!client,
    url: url ? url.replace(/^https?:\/\//, "").split(".")[0] : null,
  };
}

/**
 * Test Supabase connection live
 */
export async function testSupabaseConnection(url, key) {
  if (!url || !key) {
    return { success: false, message: "Project URL and Anon API Key are required!" };
  }

  try {
    const testClient = createClient(url.trim(), key.trim());
    const { data, error } = await testClient.from("leads").select("id").limit(1);

    if (error) {
      if (
        error.code === "42P01" ||
        error.message?.includes("relation \"leads\" does not exist")
      ) {
        return {
          success: true,
          tableMissing: true,
          message:
            "Connected to Supabase! The 'leads' table has not been created yet. Please execute the provided SQL setup script.",
        };
      }
      return { success: false, message: error.message || "Connection failed" };
    }

    return {
      success: true,
      tableMissing: false,
      message: "🟢 Supabase Cloud PostgreSQL successfully connected!",
    };
  } catch (err) {
    return { success: false, message: err.message || "Failed to reach Supabase" };
  }
}

/**
 * Read local cached leads
 */
function getLocalLeads() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(SEED_LEADS));
      return SEED_LEADS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_LEADS;
  }
}

/**
 * Save leads to local storage
 */
function saveLocalLeads(leads) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(leads));
}

export function reseedLocalLeads() {
  saveLocalLeads(SEED_LEADS);
  return SEED_LEADS;
}

export function clearAllLocalLeads() {
  saveLocalLeads([]);
  return [];
}

/**
 * Sync all local leads to Supabase cloud
 */
export async function syncLocalLeadsToSupabase() {
  const sb = getSupabase();
  if (!sb) return { success: false, message: "Supabase is not configured or connected!" };

  const localLeads = getLocalLeads();
  if (!localLeads.length) return { success: true, count: 0 };

  try {
    const { error } = await sb.from("leads").upsert(localLeads, { onConflict: "id" });
    if (error) throw error;
    return { success: true, count: localLeads.length };
  } catch (err) {
    console.error("Sync to Supabase failed:", err);
    return { success: false, message: err.message };
  }
}

/**
 * Create a new lead (Cloud + Local)
 */
export async function createLead(lead) {
  const record = {
    id: crypto.randomUUID(),
    name: lead.name || "",
    phone: lead.phone || "",
    destination: lead.destination || "",
    travellers: lead.travellers || "",
    preferred_date: lead.preferred_date || "",
    status: lead.status || "new",
    notes: lead.notes || "",
    created_at: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from("leads").insert([record]).select();
      if (!error && data?.[0]) {
        // Also update local cache
        const local = getLocalLeads();
        local.unshift(data[0]);
        saveLocalLeads(local);
        return data[0];
      }
      console.warn("Supabase insert returned error, falling back to local:", error);
    } catch (err) {
      console.warn("Supabase insert exception:", err);
    }
  }

  // Fallback to local
  const leads = getLocalLeads();
  leads.unshift(record);
  saveLocalLeads(leads);
  return record;
}

/**
 * Fetch all leads (newest first)
 */
export async function fetchLeads() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          saveLocalLeads(data);
          return data;
        } else {
          // If Supabase table is completely empty, auto-seed local leads to it
          const local = getLocalLeads();
          if (local.length > 0) {
            sb.from("leads").upsert(local).then();
          }
          return local;
        }
      }
      console.warn("Supabase fetch returned error, using local fallback:", error);
    } catch (err) {
      console.warn("Supabase fetch exception:", err);
    }
  }
  return getLocalLeads();
}

/**
 * Update lead status or notes
 */
export async function updateLead(id, updates) {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select();

      if (!error && data?.[0]) {
        const leads = getLocalLeads();
        const idx = leads.findIndex((l) => l.id === id);
        if (idx !== -1) {
          leads[idx] = { ...leads[idx], ...updates };
          saveLocalLeads(leads);
        }
        return data[0];
      }
    } catch (err) {
      console.warn("Supabase update exception:", err);
    }
  }

  // Local fallback
  const leads = getLocalLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx !== -1) {
    leads[idx] = { ...leads[idx], ...updates };
    saveLocalLeads(leads);
    return leads[idx];
  }
  return null;
}

/**
 * Delete a lead
 */
export async function deleteLead(id) {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("leads").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase delete exception:", err);
    }
  }
  const leads = getLocalLeads().filter((l) => l.id !== id);
  saveLocalLeads(leads);
}

/**
 * Get stats overview
 */
export async function getLeadStats() {
  const leads = await fetchLeads();
  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "new").length;
  const contacted = leads.filter((l) => l.status === "contacted").length;
  const booked = leads.filter((l) => l.status === "booked").length;
  const cancelled = leads.filter((l) => l.status === "cancelled").length;

  // Most popular destination & destination breakdown
  const destCount = {};
  leads.forEach((l) => {
    if (l.destination) {
      const d = l.destination.trim();
      const norm = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
      destCount[norm] = (destCount[norm] || 0) + 1;
    }
  });

  const sortedDest = Object.entries(destCount).sort((a, b) => b[1] - a[1]);
  const topDest = sortedDest[0];

  return {
    total,
    new: newCount,
    contacted,
    booked,
    cancelled,
    topDestination: topDest ? topDest[0] : "—",
    topDestCount: topDest ? topDest[1] : 0,
    destinationsList: sortedDest,
  };
}
