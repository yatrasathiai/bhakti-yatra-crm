import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  getStorageInfo,
} from "../services/databaseService";
import { fetchPackages, savePackage, deletePackage } from "../services/packageService";
import SettingsTab from "./SettingsTab";
import "./CrmDashboard.css";
import "./ToursCatalog.css";

const DHAM_ICONS = {
  ayodhya: "ॐ",
  kedarnath: "🏔️",
  badrinath: "⛰️",
  vaishno: "🌸",
  chardham: "✨",
  tirupati: "🚩",
  kashi: "🔱",
  varanasi: "🔱",
  vrindavan: "🦚",
  mathura: "🦚",
};

function getDhamIcon(dest) {
  if (!dest) return "🛕";
  const low = dest.toLowerCase();
  for (const [k, v] of Object.entries(DHAM_ICONS)) {
    if (low.includes(k)) return v;
  }
  return "🛕";
}

const STATUS_CONFIG = {
  new: { label: "New Lead", pillClass: "new", dotColor: "#F59E0B" },
  contacted: { label: "Contacted", pillClass: "contacted", dotColor: "#3B82F6" },
  booked: { label: "Booked", pillClass: "booked", dotColor: "#10B981" },
  cancelled: { label: "Cancelled", pillClass: "cancelled", dotColor: "#EF4444" },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " • " +
    d.toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

function downloadLeadsCsv(leads) {
  if (!leads.length) return false;
  const headers = ["ID", "Name", "Phone", "Destination", "Travellers", "Date", "Status", "Notes", "Created At"];
  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${l.name || ""}"`,
    `"${l.phone || ""}"`,
    `"${l.destination || ""}"`,
    `"${l.travellers || ""}"`,
    `"${l.preferred_date || ""}"`,
    `"${l.status || ""}"`,
    `"${(l.notes || "").replace(/"/g, '""')}"`,
    `"${l.created_at || ""}"`,
  ]);

  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = `yatra-saathi-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export default function CrmDashboard({ onSwitchToChat }) {
  // Navigation
  const [activeTab, setActiveTab] = useState("leads"); // "overview" | "leads" | "pipeline" | "tours" | "settings"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [packagesList, setPackagesList] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDest, setFilterDest] = useState("all");
  const [loading, setLoading] = useState(true);

  // Inspector Drawer & Modals
  const [inspectingLead, setInspectingLead] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteTourId, setConfirmDeleteTourId] = useState(null);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now();
    setToasts((curr) => [...curr, { id, message }]);
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, 3000);
  };

  // Lead Form
  const [addLeadForm, setAddLeadForm] = useState({
    name: "",
    phone: "",
    destination: "Ayodhya",
    travellers: "2",
    preferred_date: "",
    status: "new",
    notes: "",
  });

  // Tour Package Form (Add / Edit)
  const [tourForm, setTourForm] = useState({
    id: "",
    name: "",
    hindi: "",
    days: "3 Din · 2 Raat",
    price: "₹7,999",
    from: "Delhi se",
    icon: "ॐ",
    inclusions: "Hotel Stay, Satvik Meals, AC Cab, VIP Darshan Assist",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadsData, statsData] = await Promise.all([fetchLeads(), getLeadStats()]);
    setLeads(leadsData);
    setStats(statsData);
    setPackagesList(fetchPackages());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Lead Actions
  const handleUpdateStatus = async (id, newStatus) => {
    await updateLead(id, { status: newStatus });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    if (inspectingLead?.id === id) {
      setInspectingLead((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    getLeadStats().then(setStats);
  };

  const handleUpdateNotes = async (id, notes) => {
    await updateLead(id, { notes });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
    if (inspectingLead?.id === id) {
      setInspectingLead((prev) => ({ ...prev, notes }));
    }
  };

  const handleConfirmDeleteLead = async () => {
    if (!confirmDeleteId) return;
    await deleteLead(confirmDeleteId);
    if (inspectingLead?.id === confirmDeleteId) setInspectingLead(null);
    setConfirmDeleteId(null);
    showToast("Lead successfully deleted");
    loadData();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!addLeadForm.name.trim() || !addLeadForm.phone.trim()) {
      return showToast("⚠️ Naam aur Phone zaroori hain!");
    }
    await createLead(addLeadForm);
    setShowAddLeadModal(false);
    setAddLeadForm({
      name: "",
      phone: "",
      destination: "Ayodhya",
      travellers: "2",
      preferred_date: "",
      status: "new",
      notes: "",
    });
    showToast("✅ Nayi lead successfully save ho gayi!");
    loadData();
  };

  // Tour Package Actions
  const handleSaveTourSubmit = (e) => {
    e.preventDefault();
    if (!tourForm.name.trim() || !tourForm.price.trim()) {
      return showToast("⚠️ Package Name aur Price zaroori hain!");
    }

    const payload = {
      ...tourForm,
      inclusions: typeof tourForm.inclusions === "string"
        ? tourForm.inclusions.split(",").map((s) => s.trim()).filter(Boolean)
        : tourForm.inclusions,
    };

    const updated = savePackage(payload);
    setPackagesList(updated);
    setShowTourModal(false);
    setTourForm({
      id: "",
      name: "",
      hindi: "",
      days: "3 Din · 2 Raat",
      price: "₹7,999",
      from: "Delhi se",
      icon: "ॐ",
      inclusions: "Hotel Stay, Satvik Meals, AC Cab, VIP Darshan Assist",
    });
    showToast("✅ Yatra Package successfully save ho gaya!");
  };

  const handleOpenEditTour = (tour) => {
    setTourForm({
      id: tour.id,
      name: tour.name,
      hindi: tour.hindi || "",
      days: tour.days || "",
      price: tour.price || "",
      from: tour.from || "",
      icon: tour.icon || "ॐ",
      inclusions: Array.isArray(tour.inclusions) ? tour.inclusions.join(", ") : (tour.inclusions || ""),
    });
    setShowTourModal(true);
  };

  const handleConfirmDeleteTour = () => {
    if (!confirmDeleteTourId) return;
    const updated = deletePackage(confirmDeleteTourId);
    setPackagesList(updated);
    setConfirmDeleteTourId(null);
    showToast("Package delete ho gaya");
  };

  // WhatsApp Sender
  const sendWhatsApp = (lead, template) => {
    const dest = lead.destination || "Teerth Yatra";
    let text = "";
    if (template === "welcome") {
      text = `Namaste ${lead.name || ""} ji 🙏\nAapne Yatra Saathi par *${dest}* yatra ke liye enquiry ki thi.\nHumari team aapki yatra plan karne mein kaise sahayata karein?`;
    } else if (template === "quote") {
      text = `Jai Shri Ram ${lead.name || ""} ji 🙏\n*${dest}* yatra ke best packages humare paas uplabdh hain.\n• Transport, Stay aur Darshan Guidance shamil\nKya aap preferred dates confirm kar sakte hain?`;
    } else if (template === "booked") {
      text = `Namaste ${lead.name || ""} ji 🙏\nAapki *${dest}* yatra booking confirm karne ke liye itinerary taiyaar hai. Kripya booking formalities poori karein. Dhanyavaad!`;
    }

    const phone = lead.phone ? `91${lead.phone.replace(/\D/g, "").slice(-10)}` : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    setShowWaModal(null);
    if (lead.status === "new") {
      handleUpdateStatus(lead.id, "contacted");
    }
    showToast("📱 WhatsApp khul raha hai...");
  };

  // Unique Destinations
  const uniqueDestinations = useMemo(() => {
    const set = new Set();
    leads.forEach((l) => l.destination && set.add(l.destination.toLowerCase()));
    return Array.from(set);
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filterStatus !== "all" && lead.status !== filterStatus) return false;
      if (filterDest !== "all" && (lead.destination || "").toLowerCase() !== filterDest.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (lead.name || "").toLowerCase().includes(q) ||
          (lead.phone || "").includes(q) ||
          (lead.destination || "").toLowerCase().includes(q) ||
          (lead.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, filterStatus, filterDest, search]);

  return (
    <div className="crm-app-shell">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div className="crm-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ================= LEFT SAAS SIDEBAR ================= */}
      <aside className={`crm-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="crm-sidebar-brand">
          <div className="crm-brand-left">
            <div className="crm-brand-icon">ॐ</div>
            <div className="crm-brand-title">
              <strong>Yatra Saathi CRM</strong>
              <span>Pilgrimage Business Suite</span>
            </div>
          </div>
          <button
            className="crm-sidebar-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="crm-nav-list">
          <button
            className={`crm-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("overview");
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-nav-left">
              <span>📊</span> Overview
            </div>
          </button>

          <button
            className={`crm-nav-item ${activeTab === "leads" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("leads");
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-nav-left">
              <span>👥</span> All Leads
            </div>
            <span className="crm-nav-badge">{leads.length}</span>
          </button>

          <button
            className={`crm-nav-item ${activeTab === "pipeline" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pipeline");
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-nav-left">
              <span>📌</span> Pipeline Kanban
            </div>
            {stats.new > 0 && <span className="crm-nav-badge">{stats.new} new</span>}
          </button>

          <button
            className={`crm-nav-item ${activeTab === "tours" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("tours");
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-nav-left">
              <span>📦</span> Yatra Packages
            </div>
            <span className="crm-nav-badge">{packagesList.length}</span>
          </button>

          <button
            className={`crm-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("settings");
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-nav-left">
              <span>⚙️</span> Settings & PIN
            </div>
          </button>
        </nav>

        <div className="crm-sidebar-footer">
          <div className="crm-admin-pill">
            <div className="crm-admin-avatar">AD</div>
            <div className="crm-admin-meta">
              <strong>Admin Organiser</strong>
              <span>● Operational</span>
            </div>
          </div>
          <button
            className="crm-logout-btn"
            onClick={() => {
              sessionStorage.removeItem("yatra_crm_auth");
              onSwitchToChat();
            }}
            title="Lock Panel & Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT ================= */}
      <div className="crm-main-viewport">
        {/* TOPBAR */}
        <header className="crm-topbar">
          <div className="crm-topbar-left">
            <button
              className="crm-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="crm-topbar-title">
              <h1>
                {activeTab === "overview" && "Executive Overview"}
                {activeTab === "leads" && "Devotee Enquiries & Leads"}
                {activeTab === "pipeline" && "Yatra Lead Pipeline"}
                {activeTab === "tours" && "Pavitra Yatra Packages Catalog"}
                {activeTab === "settings" && "System & Security Settings"}
              </h1>
            </div>
          </div>

          <div className="crm-topbar-actions">
            {activeTab === "tours" ? (
              <button
                className="btn-primary btn-topbar-action"
                onClick={() => {
                  setTourForm({
                    id: "",
                    name: "",
                    hindi: "",
                    days: "3 Din · 2 Raat",
                    price: "₹7,999",
                    from: "Delhi se",
                    icon: "ॐ",
                    inclusions: "Hotel Stay, Satvik Meals, AC Cab, VIP Darshan Assist",
                  });
                  setShowTourModal(true);
                }}
              >
                <span>+</span>
                <span className="btn-label-desktop">Naya Package Add Karein</span>
                <span className="btn-label-mobile">Package</span>
              </button>
            ) : (
              <>
                <button
                  className="btn-secondary btn-topbar-action btn-export-action"
                  onClick={() => {
                    const ok = downloadLeadsCsv(leads);
                    if (ok) showToast("📥 Leads CSV download ho gaya!");
                  }}
                  title="Export Leads CSV"
                >
                  <span>📥</span>
                  <span className="btn-label-desktop">Export CSV</span>
                </button>
                <button
                  className="btn-primary btn-topbar-action"
                  onClick={() => setShowAddLeadModal(true)}
                >
                  <span>+</span>
                  <span className="btn-label-desktop">Nayi Lead</span>
                  <span className="btn-label-mobile">Lead</span>
                </button>
              </>
            )}
            <button
              className="btn-secondary btn-topbar-action btn-bot-action"
              onClick={onSwitchToChat}
              title="Open Public Devotional Chatbot"
            >
              <span>💬</span>
              <span className="btn-label-desktop">Public Chatbot</span>
              <span className="btn-label-mobile">Bot</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEW BODY */}
        <main className="crm-view-body">
          {/* TAB 1: INTERACTIVE EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && (
            <div className="overview-container">
              {/* Top Cloud & Realtime Status Ribbon */}
              <div className="overview-sync-ribbon">
                <div className="sync-ribbon-left">
                  {getStorageInfo().isCloud ? (
                    <span className="sync-badge cloud" title="Connected to Supabase PostgreSQL">
                      <span className="sync-dot live" /> 🟢 Supabase Cloud DB Active
                    </span>
                  ) : (
                    <span
                      className="sync-badge local interactive-badge"
                      onClick={() => setActiveTab("settings")}
                      title="Click to configure Supabase Cloud in Settings"
                    >
                      <span className="sync-dot pulse" /> 🟡 Local Storage Mode · <u>Connect Supabase Cloud ➔</u>
                    </span>
                  )}
                  <span className="sync-time-label">
                    Total Devotees Cached: <strong>{leads.length}</strong> · Active Tours: <strong>{packagesList.length}</strong>
                  </span>
                </div>
                <div className="sync-ribbon-right">
                  <button
                    className="btn-sync-refresh"
                    onClick={() => {
                      loadData();
                      showToast("🔄 Data refreshed!");
                    }}
                    title="Refresh data from database"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* 5 Interactive Metrics Cards */}
              <div className="crm-metrics-grid">
                {/* 1. Total Enquiries */}
                <div
                  className="metric-card total interactive"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterDest("all");
                    setSearch("");
                    setActiveTab("leads");
                  }}
                  title="Click to view all leads"
                >
                  <div className="metric-card-header">
                    <span className="metric-title">Total Enquiries</span>
                    <div className="metric-icon-wrap">👥</div>
                  </div>
                  <span className="metric-value">{stats.total || 0}</span>
                  <span className="metric-footer">Lifetime captured leads</span>
                  <div className="metric-card-action-hint">
                    <span>Sabhi Leads Dekhein</span>
                    <span>➔</span>
                  </div>
                </div>

                {/* 2. New Enquiries */}
                <div
                  className="metric-card new interactive"
                  onClick={() => {
                    setFilterStatus("new");
                    setFilterDest("all");
                    setActiveTab("leads");
                  }}
                  title="Click to filter new devotee leads"
                >
                  <div className="metric-card-header">
                    <span className="metric-title">New Enquiries</span>
                    <div className="metric-icon-wrap">🟡</div>
                  </div>
                  <span className="metric-value">{stats.new || 0}</span>
                  <span className="metric-footer">Requires initial call/WhatsApp</span>
                  <div className="metric-card-action-hint">
                    <span>Filter New Leads</span>
                    <span>➔</span>
                  </div>
                </div>

                {/* 3. In Discussion */}
                <div
                  className="metric-card contacted interactive"
                  onClick={() => {
                    setFilterStatus("contacted");
                    setFilterDest("all");
                    setActiveTab("leads");
                  }}
                  title="Click to filter devotees in discussion"
                >
                  <div className="metric-card-header">
                    <span className="metric-title">In Discussion</span>
                    <div className="metric-icon-wrap">🔵</div>
                  </div>
                  <span className="metric-value">{stats.contacted || 0}</span>
                  <span className="metric-footer">Itinerary & rates shared</span>
                  <div className="metric-card-action-hint">
                    <span>Filter Contacted</span>
                    <span>➔</span>
                  </div>
                </div>

                {/* 4. Confirmed Bookings */}
                <div
                  className="metric-card booked interactive"
                  onClick={() => {
                    setFilterStatus("booked");
                    setFilterDest("all");
                    setActiveTab("leads");
                  }}
                  title="Click to filter confirmed yatras"
                >
                  <div className="metric-card-header">
                    <span className="metric-title">Confirmed Yatras</span>
                    <div className="metric-icon-wrap">🟢</div>
                  </div>
                  <span className="metric-value">{stats.booked || 0}</span>
                  <span className="metric-footer">Advance confirmed</span>
                  <div className="metric-card-action-hint">
                    <span>Filter Booked</span>
                    <span>➔</span>
                  </div>
                </div>

                {/* 5. Most Demanded */}
                <div
                  className="metric-card top interactive"
                  onClick={() => {
                    if (stats.topDestination && stats.topDestination !== "—") {
                      setFilterDest(stats.topDestination.toLowerCase());
                      setFilterStatus("all");
                      setActiveTab("leads");
                    }
                  }}
                  title="Click to filter leads for top destination"
                >
                  <div className="metric-card-header">
                    <span className="metric-title">Most Demanded</span>
                    <div className="metric-icon-wrap">🔥</div>
                  </div>
                  <span className="metric-value">{stats.topDestination || "—"}</span>
                  <span className="metric-footer">
                    {stats.topDestCount ? `${stats.topDestCount} devotee enquiries` : "Tracking active"}
                  </span>
                  <div className="metric-card-action-hint">
                    <span>Filter Dham Leads</span>
                    <span>➔</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Hub Grid */}
              <div className="overview-quick-actions-grid">
                <div className="quick-action-card" onClick={() => setShowAddLeadModal(true)}>
                  <div className="quick-action-icon">➕</div>
                  <div className="quick-action-content">
                    <strong>Nayi Devotee Enquiry Darj Karein</strong>
                    <span>Manually yatri details, destination aur phone save karein</span>
                  </div>
                  <span className="quick-action-arrow">➔</span>
                </div>

                <div className="quick-action-card" onClick={() => setActiveTab("pipeline")}>
                  <div className="quick-action-icon">📌</div>
                  <div className="quick-action-content">
                    <strong>Pipeline Kanban Board</strong>
                    <span>Stages view: New, Contacted, Booked, Cancelled</span>
                  </div>
                  <span className="quick-action-arrow">➔</span>
                </div>

                <div className="quick-action-card" onClick={() => setActiveTab("tours")}>
                  <div className="quick-action-icon">📦</div>
                  <div className="quick-action-content">
                    <strong>Pavitra Packages Catalog ({packagesList.length})</strong>
                    <span>Rates, stay inclusions aur itineraries manage karein</span>
                  </div>
                  <span className="quick-action-arrow">➔</span>
                </div>

                <div
                  className="quick-action-card"
                  onClick={() => {
                    const ok = downloadLeadsCsv(leads);
                    if (ok) showToast("📥 Leads CSV download ho gaya!");
                  }}
                >
                  <div className="quick-action-icon">📥</div>
                  <div className="quick-action-content">
                    <strong>Export Devotees Sheet</strong>
                    <span>Complete enquiries CSV Excel ke liye download karein</span>
                  </div>
                  <span className="quick-action-arrow">➔</span>
                </div>
              </div>

              {/* Dual Column Analytics: Dham Demands & Conversion Funnel */}
              <div className="overview-dual-grid">
                {/* Column 1: Pilgrimage Destinations Distribution */}
                <div className="overview-card-block">
                  <div className="overview-card-block-header">
                    <div>
                      <h4>🛕 Pavitra Dham Demands (Click to Filter)</h4>
                      <p>Devotees ki pasand ke hisab se top pilgrimage destinations</p>
                    </div>
                    <button
                      className="btn-link-action"
                      onClick={() => {
                        setFilterDest("all");
                        setActiveTab("leads");
                      }}
                    >
                      Sabhi ({uniqueDestinations.length}) ➔
                    </button>
                  </div>

                  <div className="destinations-pills-list">
                    {uniqueDestinations.length === 0 ? (
                      <p style={{ color: "var(--crm-text-muted)", fontSize: "0.85rem" }}>
                        Abhi koi destination record nahi hai.
                      </p>
                    ) : (
                      uniqueDestinations.map((d) => {
                        const count = leads.filter(
                          (l) => (l.destination || "").toLowerCase() === d.toLowerCase()
                        ).length;
                        const percent = Math.round((count / (leads.length || 1)) * 100);
                        return (
                          <div
                            key={d}
                            className="destination-interactive-pill"
                            onClick={() => {
                              setFilterDest(d);
                              setFilterStatus("all");
                              setActiveTab("leads");
                            }}
                            title={`Filter ${d.toUpperCase()} enquiries`}
                          >
                            <div className="dest-pill-left">
                              <span className="dest-symbol">{getDhamIcon(d)}</span>
                              <strong className="dest-name">{d.toUpperCase()}</strong>
                            </div>
                            <div className="dest-pill-right">
                              <span className="dest-count-tag">{count} enquiries</span>
                              <span className="dest-pct">{percent}%</span>
                              <span className="dest-arrow">➔</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Column 2: Lead Conversion Funnel */}
                <div className="overview-card-block">
                  <div className="overview-card-block-header">
                    <div>
                      <h4>📊 Lead Conversion Funnel</h4>
                      <p>Enquiry se lekar confirmed booking tak ka safar</p>
                    </div>
                    <button className="btn-link-action" onClick={() => setActiveTab("pipeline")}>
                      Kanban Dekhein ➔
                    </button>
                  </div>

                  <div className="funnel-stages-container">
                    {/* Stage 1: Captured */}
                    <div
                      className="funnel-stage-item interactive"
                      onClick={() => {
                        setFilterStatus("all");
                        setActiveTab("leads");
                      }}
                      title="Click to view all captured leads"
                    >
                      <div className="funnel-stage-header">
                        <span>1. Total Captured Devotees</span>
                        <strong>{stats.total || 0} (100%)</strong>
                      </div>
                      <div className="funnel-progress-track">
                        <div className="funnel-progress-fill stage-1" style={{ width: "100%" }} />
                      </div>
                    </div>

                    {/* Stage 2: Contacted */}
                    <div
                      className="funnel-stage-item interactive"
                      onClick={() => {
                        setFilterStatus("contacted");
                        setActiveTab("leads");
                      }}
                      title="Click to filter contacted devotees"
                    >
                      <div className="funnel-stage-header">
                        <span>2. Devotees In Discussion</span>
                        <strong>
                          {stats.contacted || 0} (
                          {stats.total ? Math.round((stats.contacted / stats.total) * 100) : 0}%)
                        </strong>
                      </div>
                      <div className="funnel-progress-track">
                        <div
                          className="funnel-progress-fill stage-2"
                          style={{
                            width: `${
                              stats.total ? Math.round((stats.contacted / stats.total) * 100) : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stage 3: Booked */}
                    <div
                      className="funnel-stage-item interactive"
                      onClick={() => {
                        setFilterStatus("booked");
                        setActiveTab("leads");
                      }}
                      title="Click to filter confirmed bookings"
                    >
                      <div className="funnel-stage-header">
                        <span>3. Confirmed Bookings</span>
                        <strong>
                          {stats.booked || 0} (
                          {stats.total ? Math.round((stats.booked / stats.total) * 100) : 0}%)
                        </strong>
                      </div>
                      <div className="funnel-progress-track">
                        <div
                          className="funnel-progress-fill stage-3"
                          style={{
                            width: `${
                              stats.total ? Math.round((stats.booked / stats.total) * 100) : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT LEADS QUICK TABLE (Now Clickable Row) */}
              <div className="crm-table-card">
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--crm-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#FAF8F6",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.96rem" }}>Taza Enquiries (Recent Leads)</strong>
                    <p
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "0.78rem",
                        color: "var(--crm-text-muted)",
                      }}
                    >
                      Kisi bhi row par click karke details aur remarks update karein
                    </p>
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => setActiveTab("leads")}
                  >
                    Sabhi Leads Dekhein ➔
                  </button>
                </div>
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Yatri Naam</th>
                      <th>Phone</th>
                      <th>Destination</th>
                      <th>Yatri</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 6).map((l) => (
                      <tr
                        key={l.id}
                        className="clickable-row"
                        onClick={() => setInspectingLead(l)}
                        title="Click to open devotee inspector"
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "16px" }}>{getDhamIcon(l.destination)}</span>
                            <strong>{l.name || "Devotee"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="phone-tag">{l.phone || "—"}</span>
                        </td>
                        <td>
                          <span className="dest-pill">{l.destination || "Yatra"}</span>
                        </td>
                        <td>{l.travellers || "—"}</td>
                        <td>
                          <span className={`status-pill ${l.status || "new"}`}>
                            {STATUS_CONFIG[l.status || "new"]?.label}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button className="btn-whatsapp" onClick={() => setShowWaModal(l)}>
                            📱 WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ALL LEADS TABLE */}
          {activeTab === "leads" && (
            <>
              {/* TOOLBAR */}
              <div className="crm-data-toolbar">
                <div className="toolbar-search-box">
                  <span className="toolbar-search-icon">🔍</span>
                  <input
                    className="toolbar-search-input"
                    type="text"
                    placeholder="Search by naam, phone, destination, remarks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="toolbar-filters">
                  <select
                    className="toolbar-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses ({leads.length})</option>
                    <option value="new">🟡 New ({stats.new || 0})</option>
                    <option value="contacted">🔵 Contacted ({stats.contacted || 0})</option>
                    <option value="booked">🟢 Booked ({stats.booked || 0})</option>
                    <option value="cancelled">🔴 Cancelled ({stats.cancelled || 0})</option>
                  </select>

                  <select
                    className="toolbar-select"
                    value={filterDest}
                    onChange={(e) => setFilterDest(e.target.value)}
                  >
                    <option value="all">All Destinations</option>
                    {uniqueDestinations.map((d) => (
                      <option key={d} value={d}>{d.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATA TABLE */}
              <div className="crm-table-card">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Yatri Details</th>
                      <th>Contact Info</th>
                      <th>Dham / Destination</th>
                      <th>Yatri & Date</th>
                      <th>Pipeline Status</th>
                      <th>Internal Notes</th>
                      <th>Enquiry Timestamp</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="lead-cell-name" onClick={() => setInspectingLead(lead)}>
                            <strong>{lead.name || "Unnamed Devotee"}</strong>
                            <span className="lead-cell-sub">ID: #{lead.id.slice(0, 6)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="phone-tag">{lead.phone || "—"}</span>
                        </td>
                        <td>
                          <span className="dest-pill">{lead.destination || "Teerth Yatra"}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.82rem" }}>
                            <strong>{lead.travellers ? `${lead.travellers} yatri` : "—"}</strong>
                            <div style={{ color: "var(--crm-text-muted)", fontSize: "0.75rem" }}>
                              {lead.preferred_date || "Open dates"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className={`status-pill ${lead.status || "new"}`}
                            value={lead.status || "new"}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          >
                            <option value="new">🟡 New</option>
                            <option value="contacted">🔵 Contacted</option>
                            <option value="booked">🟢 Booked</option>
                            <option value="cancelled">🔴 Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="notes-input"
                            value={lead.notes || ""}
                            placeholder="Add remark..."
                            onChange={(e) => handleUpdateNotes(lead.id, e.target.value)}
                          />
                        </td>
                        <td style={{ fontSize: "0.76rem", color: "var(--crm-text-muted)" }}>
                          {formatDate(lead.created_at)}
                        </td>
                        <td>
                          <div className="table-actions">
                            {lead.phone && (
                              <button
                                className="btn-whatsapp"
                                onClick={() => setShowWaModal(lead)}
                                title="Send WhatsApp Message"
                              >
                                📱 WA
                              </button>
                            )}
                            <button
                              className="btn-icon-soft"
                              onClick={() => setInspectingLead(lead)}
                              title="Inspect Full Details"
                            >
                              🔍
                            </button>
                            <button
                              className="btn-icon-soft danger"
                              onClick={() => setConfirmDeleteId(lead.id)}
                              title="Delete Lead"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--crm-text-muted)" }}>
                          🕉️ Koi lead nahi mili. Nayi lead add karne ke liye "+ Nayi Lead" dabayein.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 3: PIPELINE KANBAN */}
          {activeTab === "pipeline" && (
            <div className="crm-kanban">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const colLeads = leads.filter((l) => (l.status || "new") === key);
                return (
                  <div key={key} className="kanban-col">
                    <div className={`kanban-col-header ${key}`}>
                      <span>{config.label}</span>
                      <span className="kanban-badge">{colLeads.length}</span>
                    </div>

                    <div className="kanban-cards-list">
                      {colLeads.map((lead) => (
                        <div key={lead.id} className="kanban-card" onClick={() => setInspectingLead(lead)}>
                          <div className="kanban-card-top">
                            <strong>{lead.name || "Unnamed"}</strong>
                            <span className="dest-pill">{lead.destination || "Yatra"}</span>
                          </div>
                          <div className="kanban-card-phone">📞 {lead.phone || "No phone"}</div>
                          <div className="kanban-card-details">
                            <span>👥 {lead.travellers || "—"}</span>
                            <span>•</span>
                            <span>📅 {lead.preferred_date || "Open dates"}</span>
                          </div>
                          {lead.notes && (
                            <div style={{ fontSize: "0.75rem", color: "var(--crm-text-muted)", fontStyle: "italic" }}>
                              "{lead.notes}"
                            </div>
                          )}
                          <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn-whatsapp"
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                              onClick={() => setShowWaModal(lead)}
                            >
                              📱 WA
                            </button>
                            <select
                              className={`status-pill ${lead.status || "new"}`}
                              style={{ fontSize: "0.74rem", padding: "2px 6px" }}
                              value={lead.status || "new"}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                            >
                              <option value="new">➔ New</option>
                              <option value="contacted">➔ Contacted</option>
                              <option value="booked">➔ Booked</option>
                              <option value="cancelled">➔ Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: REDESIGNED YATRA PACKAGES CATALOG */}
          {activeTab === "tours" && (
            <div className="tours-catalog-wrapper">
              <div className="tours-catalog-toolbar">
                <div className="tours-toolbar-left">
                  <h3>Pavitra Yatra Packages</h3>
                  <span className="tours-count-badge">{packagesList.length} Active Packages</span>
                </div>
                <div>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setTourForm({
                        id: "",
                        name: "",
                        hindi: "",
                        days: "3 Din · 2 Raat",
                        price: "₹7,999",
                        from: "Delhi se",
                        icon: "ॐ",
                        inclusions: "Hotel Stay, Satvik Meals, AC Cab, VIP Darshan Assist",
                      });
                      setShowTourModal(true);
                    }}
                  >
                    + Naya Package Add Karein
                  </button>
                </div>
              </div>

              <div className="tours-grid">
                {packagesList.map((tour) => (
                  <div key={tour.id} className="tour-card-rich">
                    <div className="tour-card-topbar">
                      <div className="tour-icon-box">{tour.icon || "ॐ"}</div>
                      <div className="tour-top-actions">
                        <span className="tour-status-tag">
                          <i /> Active
                        </span>
                        <button
                          className="btn-card-edit"
                          onClick={() => handleOpenEditTour(tour)}
                          title="Edit Package"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-card-delete"
                          onClick={() => setConfirmDeleteTourId(tour.id)}
                          title="Delete Package"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="tour-card-info">
                      <h4>{tour.name}</h4>
                      {tour.hindi && <span className="tour-card-hindi">{tour.hindi}</span>}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.78rem" }}>
                      <span className="inclusion-pill">⏱️ {tour.days}</span>
                      {tour.from && <span className="inclusion-pill">📍 {tour.from}</span>}
                    </div>

                    <div className="tour-inclusions-list">
                      {Array.isArray(tour.inclusions) &&
                        tour.inclusions.map((item, idx) => (
                          <span key={idx} className="inclusion-pill">
                            ✓ {item}
                          </span>
                        ))}
                    </div>

                    <div className="tour-card-footer">
                      <div className="tour-price-block">
                        <span className="tour-price-label">Starting Price</span>
                        <div className="tour-price-val">
                          {tour.price} <small>/ vyakti</small>
                        </div>
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ height: "34px", fontSize: "0.78rem" }}
                        onClick={() => handleOpenEditTour(tour)}
                      >
                        Modify Rates
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REDESIGNED ENTERPRISE SETTINGS */}
          {activeTab === "settings" && (
            <SettingsTab
              leads={leads}
              packagesList={packagesList}
              onReloadData={loadData}
              showToast={showToast}
              onLockDashboard={() => {
                sessionStorage.removeItem("yatra_crm_auth");
                if (onSwitchToChat) onSwitchToChat();
              }}
            />
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="crm-mobile-bottom-bar">
          <button
            className={`mobile-bar-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="mobile-bar-icon">📊</span>
            <span className="mobile-bar-label">Overview</span>
          </button>
          <button
            className={`mobile-bar-item ${activeTab === "leads" ? "active" : ""}`}
            onClick={() => setActiveTab("leads")}
          >
            <span className="mobile-bar-icon">👥</span>
            <span className="mobile-bar-label">Leads</span>
            {leads.length > 0 && <span className="mobile-bar-badge">{leads.length}</span>}
          </button>
          <button
            className={`mobile-bar-item ${activeTab === "pipeline" ? "active" : ""}`}
            onClick={() => setActiveTab("pipeline")}
          >
            <span className="mobile-bar-icon">📌</span>
            <span className="mobile-bar-label">Pipeline</span>
            {stats.new > 0 && <span className="mobile-bar-badge dot" />}
          </button>
          <button
            className={`mobile-bar-item ${activeTab === "tours" ? "active" : ""}`}
            onClick={() => setActiveTab("tours")}
          >
            <span className="mobile-bar-icon">📦</span>
            <span className="mobile-bar-label">Packages</span>
          </button>
          <button
            className={`mobile-bar-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <span className="mobile-bar-icon">⚙️</span>
            <span className="mobile-bar-label">Settings</span>
          </button>
        </nav>
      </div>

      {/* ================= MODAL: ADD/EDIT TOUR PACKAGE ================= */}
      {showTourModal && (
        <div className="drawer-backdrop" onClick={() => setShowTourModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>{tourForm.id ? "✏️ Package Edit Karein" : "+ Naya Yatra Package Add Karein"}</h3>
              <button className="btn-icon-soft" onClick={() => setShowTourModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTourSubmit}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Package / Dham Name *</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    required
                    placeholder="e.g. Ayodhya Shri Ram Dham"
                    value={tourForm.name}
                    onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Hindi Tagline / Description</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    placeholder="e.g. Ram Lalla Darshan & Saryu Maha Aarti"
                    value={tourForm.hindi}
                    onChange={(e) => setTourForm({ ...tourForm, hindi: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="crm-form-group">
                    <label>Duration *</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      required
                      placeholder="e.g. 3 Din · 2 Raat"
                      value={tourForm.days}
                      onChange={(e) => setTourForm({ ...tourForm, days: e.target.value })}
                    />
                  </div>
                  <div className="crm-form-group">
                    <label>Starting Price *</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      required
                      placeholder="e.g. ₹5,999"
                      value={tourForm.price}
                      onChange={(e) => setTourForm({ ...tourForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <div className="crm-form-group">
                    <label>Departure Point</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      placeholder="e.g. Delhi / Lucknow se"
                      value={tourForm.from}
                      onChange={(e) => setTourForm({ ...tourForm, from: e.target.value })}
                    />
                  </div>
                  <div className="crm-form-group">
                    <label>Icon Emblem</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      placeholder="ॐ / 🏔️ / 🌸 / ✨"
                      value={tourForm.icon}
                      onChange={(e) => setTourForm({ ...tourForm, icon: e.target.value })}
                    />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label>Inclusions (comma separated)</label>
                  <textarea
                    className="crm-form-textarea"
                    rows="2"
                    placeholder="Hotel Stay, Satvik Meals, AC Cab, VIP Darshan Assist..."
                    value={tourForm.inclusions}
                    onChange={(e) => setTourForm({ ...tourForm, inclusions: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowTourModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE TOUR CONFIRMATION ================= */}
      {confirmDeleteTourId && (
        <div className="drawer-backdrop" onClick={() => setConfirmDeleteTourId(null)}>
          <div className="crm-modal-box" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ color: "var(--crm-danger)" }}>Delete Package Confirmation</h3>
              <button className="btn-icon-soft" onClick={() => setConfirmDeleteTourId(null)}>✕</button>
            </div>
            <div className="crm-modal-body">
              <p style={{ margin: 0 }}>Kya aap sach mein is yatra package ko catalog se hatana chahte hain?</p>
            </div>
            <div className="crm-modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDeleteTourId(null)}>Cancel</button>
              <button
                className="btn-primary"
                style={{ background: "var(--crm-danger)" }}
                onClick={handleConfirmDeleteTour}
              >
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SLIDE-OVER RIGHT DRAWER (INSPECTOR) ================= */}
      {inspectingLead && (
        <div className="drawer-backdrop" onClick={() => setInspectingLead(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <strong>{inspectingLead.name || "Devotee"}</strong>
                <span>Lead ID: #{inspectingLead.id}</span>
              </div>
              <button className="btn-icon-soft" onClick={() => setInspectingLead(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div className="drawer-section">
                <span className="drawer-section-title">Contact & Travel Overview</span>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <label>WhatsApp / Phone</label>
                    <strong>{inspectingLead.phone || "—"}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <label>Destination</label>
                    <strong style={{ textTransform: "capitalize" }}>{inspectingLead.destination || "—"}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <label>Yatri Count</label>
                    <strong>{inspectingLead.travellers || "—"}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <label>Travel Dates</label>
                    <strong>{inspectingLead.preferred_date || "Open"}</strong>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Pipeline Stage</span>
                <select
                  className={`status-pill ${inspectingLead.status || "new"}`}
                  style={{ width: "fit-content", fontSize: "0.88rem", padding: "6px 14px" }}
                  value={inspectingLead.status || "new"}
                  onChange={(e) => handleUpdateStatus(inspectingLead.id, e.target.value)}
                >
                  <option value="new">🟡 New Lead</option>
                  <option value="contacted">🔵 In Talks / Contacted</option>
                  <option value="booked">🟢 Confirmed Booked</option>
                  <option value="cancelled">🔴 Cancelled</option>
                </select>
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Internal Notes & Remarks</span>
                <textarea
                  rows="4"
                  className="crm-form-textarea"
                  placeholder="Yatri ki special requirements, payment details ya discussions yahan note karein..."
                  value={inspectingLead.notes || ""}
                  onChange={(e) => handleUpdateNotes(inspectingLead.id, e.target.value)}
                />
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Timeline & Timestamp</span>
                <div style={{ fontSize: "0.8rem", color: "var(--crm-text-muted)" }}>
                  Captured On: {formatDate(inspectingLead.created_at)}
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn-icon-soft danger"
                onClick={() => {
                  setConfirmDeleteId(inspectingLead.id);
                }}
              >
                Delete Lead
              </button>
              {inspectingLead.phone && (
                <button
                  className="btn-whatsapp"
                  onClick={() => setShowWaModal(inspectingLead)}
                >
                  📱 Send WhatsApp Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL LEAD CREATION ================= */}
      {showAddLeadModal && (
        <div className="drawer-backdrop" onClick={() => setShowAddLeadModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>+ Nayi Lead Register Karein</h3>
              <button className="btn-icon-soft" onClick={() => setShowAddLeadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Yatri Ka Naam *</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={addLeadForm.name}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, name: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Phone / WhatsApp *</label>
                  <input
                    className="crm-form-input"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={addLeadForm.phone}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, phone: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Pavitra Dham (Destination)</label>
                  <select
                    className="crm-form-select"
                    value={addLeadForm.destination}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, destination: e.target.value })}
                  >
                    {packagesList.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="crm-form-group">
                    <label>Kitne Yatri?</label>
                    <input
                      className="crm-form-input"
                      type="number"
                      min="1"
                      placeholder="e.g. 4"
                      value={addLeadForm.travellers}
                      onChange={(e) => setAddLeadForm({ ...addLeadForm, travellers: e.target.value })}
                    />
                  </div>
                  <div className="crm-form-group">
                    <label>Preferred Date</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      placeholder="e.g. 15 May ya June"
                      value={addLeadForm.preferred_date}
                      onChange={(e) => setAddLeadForm({ ...addLeadForm, preferred_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label>Remarks / Notes</label>
                  <textarea
                    className="crm-form-textarea"
                    rows="2"
                    placeholder="Special requirements (senior citizen, palki, budget)..."
                    value={addLeadForm.notes}
                    onChange={(e) => setAddLeadForm({ ...addLeadForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddLeadModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WHATSAPP TEMPLATE SENDER ================= */}
      {showWaModal && (
        <div className="drawer-backdrop" onClick={() => setShowWaModal(null)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>📱 Devotional WhatsApp Templates</h3>
              <button className="btn-icon-soft" onClick={() => setShowWaModal(null)}>✕</button>
            </div>
            <div className="crm-modal-body">
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--crm-text-secondary)" }}>
                <strong>{showWaModal.name}</strong> ({showWaModal.phone}) ke liye template choose karein:
              </p>

              <div className="wa-templates-grid">
                <div className="wa-template-card" onClick={() => sendWhatsApp(showWaModal, "welcome")}>
                  <strong>1. Welcome & Initial Follow-up 🙏</strong>
                  <p>"Namaste {showWaModal.name} ji 🙏 Aapne Yatra Saathi par {showWaModal.destination} yatra ke liye enquiry ki thi..."</p>
                </div>

                <div className="wa-template-card" onClick={() => sendWhatsApp(showWaModal, "quote")}>
                  <strong>2. Package Details & Itinerary Offer 📦</strong>
                  <p>"Jai Shri Ram {showWaModal.name} ji 🙏 {showWaModal.destination} package mein transport, hotel stay aur darshan assist shamil hai..."</p>
                </div>

                <div className="wa-template-card" onClick={() => sendWhatsApp(showWaModal, "booked")}>
                  <strong>3. Final Booking & Seat Confirmation 🟢</strong>
                  <p>"Namaste {showWaModal.name} ji 🙏 {showWaModal.destination} yatra booking seats confirm karne ke liye itinerary taiyaar hai..."</p>
                </div>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="btn-secondary" onClick={() => setShowWaModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE LEAD MODAL ================= */}
      {confirmDeleteId && (
        <div className="drawer-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="crm-modal-box" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ color: "var(--crm-danger)" }}>Delete Lead Confirmation</h3>
              <button className="btn-icon-soft" onClick={() => setConfirmDeleteId(null)}>✕</button>
            </div>
            <div className="crm-modal-body">
              <p style={{ margin: 0 }}>Kya aap sach mein is lead ko delete karna chahte hain? Yeh action revert nahi ho sakta.</p>
            </div>
            <div className="crm-modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className="btn-primary"
                style={{ background: "var(--crm-danger)" }}
                onClick={handleConfirmDeleteLead}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATIONS ================= */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-item">
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
