/**
 * ============================================================================
 * YATRA SAATHI — DATABASE SERVICE (Supabase + localStorage Fallback)
 * Leads ka data cloud mein save hoga. Agar Supabase setup nahi hai toh
 * localStorage mein kaam chalega.
 * ============================================================================
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const LOCAL_KEY = "yatra_crm_leads";

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

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
 * Create a new lead
 */
export async function createLead(lead) {
  const record = {
    id: crypto.randomUUID(),
    name: lead.name || "",
    phone: lead.phone || "",
    destination: lead.destination || "",
    travellers: lead.travellers || "",
    preferred_date: lead.preferred_date || "",
    status: "new",
    notes: "",
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from("leads").insert([record]).select();
    if (error) {
      console.error("Supabase insert error:", error);
      // Fallback to local
      const leads = getLocalLeads();
      leads.unshift(record);
      saveLocalLeads(leads);
      return record;
    }
    return data?.[0] || record;
  }

  // localStorage fallback
  const leads = getLocalLeads();
  leads.unshift(record);
  saveLocalLeads(leads);
  return record;
}

/**
 * Fetch all leads (newest first)
 */
export async function fetchLeads() {
  if (supabase) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return data;
  }
  return getLocalLeads();
}

/**
 * Update lead status or notes
 */
export async function updateLead(id, updates) {
  if (supabase) {
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select();
    if (!error && data) return data[0];
  }

  // localStorage fallback
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
  if (supabase) {
    await supabase.from("leads").delete().eq("id", id);
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

  // Most popular destination
  const destCount = {};
  leads.forEach((l) => {
    if (l.destination) {
      const d = l.destination.toLowerCase();
      destCount[d] = (destCount[d] || 0) + 1;
    }
  });
  const topDest = Object.entries(destCount).sort((a, b) => b[1] - a[1])[0];

  return {
    total,
    new: newCount,
    contacted,
    booked,
    cancelled,
    topDestination: topDest ? topDest[0] : "—",
    topDestCount: topDest ? topDest[1] : 0,
  };
}

