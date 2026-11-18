import { useEffect, useState, useCallback } from "react";
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
} from "../services/databaseService";
import "./CrmDashboard.css";

const STATUS_COLUMNS = [
  { key: "new", label: "🟡 New Enquiries", color: "new" },
  { key: "contacted", label: "🔵 In Talks / Contacted", color: "contacted" },
  { key: "booked", label: "🟢 Confirmed Bookings", color: "booked" },
  { key: "cancelled", label: "🔴 Cancelled / Lost", color: "cancelled" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("hi-IN", { day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

// Export leads to CSV file
function exportLeadsToCsv(leads) {
  if (!leads.length) return alert("Export karne ke liye koi leads nahi hain!");

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

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `yatra-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function CrmDashboard({ onSwitchToChat }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeView, setActiveView] = useState("table"); // "table" | "kanban"
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLeadForWa, setSelectedLeadForWa] = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  // New lead form state
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    phone: "",
    destination: "Ayodhya",
    travellers: "2",
    preferred_date: "",
    status: "new",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadsData, statsData] = await Promise.all([fetchLeads(), getLeadStats()]);
    setLeads(leadsData);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle lead updates
  const handleStatusChange = async (id, newStatus) => {
    await updateLead(id, { status: newStatus });
    loadData();
  };

  const handleNotesChange = async (id, notes) => {
    await updateLead(id, { notes });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
  };

  const handleDelete = async (id) => {
    if (!confirm("Kya aap is lead ko permanently delete karna chahte hain?")) return;
    await deleteLead(id);
    loadData();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.name.trim() || !newLeadForm.phone.trim()) {
      return alert("Naam aur Phone number zaroori hain!");
    }
    await createLead(newLeadForm);
    setShowAddModal(false);
    setNewLeadForm({
      name: "",
      phone: "",
      destination: "Ayodhya",
      travellers: "2",
      preferred_date: "",
      status: "new",
      notes: "",
    });
    loadData();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    await updateLead(editingLead.id, editingLead);
    setEditingLead(null);
    loadData();
  };

  // WhatsApp Sender
  const sendWhatsAppMessage = (lead, templateType) => {
    const dest = lead.destination || "teerth yatra";
    let messageText = "";

    if (templateType === "intro") {
      messageText = `Namaste ${lead.name || ""} ji 🙏\nAapne Yatra Saathi par *${dest}* yatra ke liye enquiry ki thi.\nHumari team aapki yatra plan karne mein kaise sahayata karein?`;
    } else if (templateType === "package") {
      messageText = `Jai Shri Ram ${lead.name || ""} ji 🙏\n*${dest}* yatra ke package details:\n• Duration: Hotel Stay, Meals & Transport shamil\n• Cab pickup & Darshan assist\n\nKya aap preferred dates aur yatriyon ki sankhya confirm kar sakte hain?`;
    } else if (templateType === "booking") {
      messageText = `Namaste ${lead.name || ""} ji 🙏\nAapki *${dest}* yatra booking ke liye humare paas seats available hain. Booking confirm karne ke liye kripya details share karein.`;
    }

    const phone = lead.phone ? `91${lead.phone.replace(/\D/g, "").slice(-10)}` : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, "_blank");
    setSelectedLeadForWa(null);
    // Auto-mark as contacted
    if (lead.status === "new") {
      handleStatusChange(lead.id, "contacted");
    }
  };

  // Filtered leads
  const filtered = leads.filter((lead) => {
    if (filterStatus !== "all" && lead.status !== filterStatus) return false;
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

  return (
    <div className="crm-root">
      {/* HEADER */}
      <header className="crm-header">
        <div className="crm-brand">
          <div className="crm-logo">ॐ</div>
          <div>
            <h2>
              Yatra Saathi CRM <span className="badge-pro">Active</span>
            </h2>
            <p>Admin Lead & Pilgrimage Management Dashboard</p>
          </div>
        </div>
        <div className="crm-header-actions">
          <button className="crm-btn primary" onClick={() => setShowAddModal(true)}>
            + Nayi Lead
          </button>
          <button className="crm-btn" onClick={() => exportLeadsToCsv(leads)} title="Export to Excel / CSV">
            📥 Export CSV
          </button>
          <button className="crm-btn" onClick={loadData} title="Refresh">
            🔄
          </button>
          <button
            className="crm-btn"
            onClick={() => {
              sessionStorage.removeItem("yatra_crm_auth");
              onSwitchToChat();
            }}
            title="Lock CRM and return to website"
          >
            🔒 Logout
          </button>
          <button className="crm-btn" onClick={onSwitchToChat} title="Open Chatbot View">
            💬 Chatbot View
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="crm-content">
        {/* STAT OVERVIEW CARDS */}
        <div className="crm-stats">
          <div className="stat-card">
            <span className="stat-label">Total Leads</span>
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-sub">Lifetime enquiries</span>
          </div>
          <div className="stat-card orange">
            <span className="stat-label">🟡 New Enquiries</span>
            <span className="stat-value">{stats.new || 0}</span>
            <span className="stat-sub">Action required</span>
          </div>
          <div className="stat-card blue">
            <span className="stat-label">🔵 In Contact</span>
            <span className="stat-value">{stats.contacted || 0}</span>
            <span className="stat-sub">Follow-up ongoing</span>
          </div>
          <div className="stat-card green">
            <span className="stat-label">🟢 Confirmed Bookings</span>
            <span className="stat-value">{stats.booked || 0}</span>
            <span className="stat-sub">Yatra confirmed</span>
          </div>
          <div className="stat-card gold">
            <span className="stat-label">🔥 Top Destination</span>
            <span className="stat-value" style={{ fontSize: "1.3rem", textTransform: "capitalize" }}>
              {stats.topDestination || "—"}
            </span>
            <span className="stat-sub">{stats.topDestCount ? `${stats.topDestCount} devotee enquiries` : "No data"}</span>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="crm-toolbar">
          <div className="crm-toolbar-left">
            <input
              className="crm-search"
              type="text"
              placeholder="🔍 Search by naam, phone, destination ya notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="crm-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status ({leads.length})</option>
              <option value="new">🟡 New ({stats.new || 0})</option>
              <option value="contacted">🔵 Contacted ({stats.contacted || 0})</option>
              <option value="booked">🟢 Booked ({stats.booked || 0})</option>
              <option value="cancelled">🔴 Cancelled ({stats.cancelled || 0})</option>
            </select>
          </div>

          <div className="crm-toolbar-right">
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${activeView === "table" ? "active" : ""}`}
                onClick={() => setActiveView("table")}
              >
                📋 Table View
              </button>
              <button
                className={`view-toggle-btn ${activeView === "kanban" ? "active" : ""}`}
                onClick={() => setActiveView("kanban")}
              >
                📌 Pipeline Kanban
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: TABLE VIEW */}
        {activeView === "table" && (
          <div className="crm-table-wrap">
            {loading && leads.length === 0 ? (
              <div className="crm-empty">
                <p>Loading leads...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="crm-empty">
                <h3>🕉️ Koi Lead Nahi Mili</h3>
                <p>
                  {leads.length === 0
                    ? "Jaise hi koi visitor chatbot par phone number dega ya aap '+ Nayi Lead' par click karenge, yahan lead dikhegi."
                    : "Search ya filter badal kar dekhein."}
                </p>
              </div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Yatri Naam</th>
                    <th>WhatsApp / Phone</th>
                    <th>Destination</th>
                    <th>Yatri</th>
                    <th>Date</th>
                    <th>Pipeline Status</th>
                    <th>Internal Notes</th>
                    <th>Enquiry Time</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id}>
                      <td className="lead-name-cell" onClick={() => setEditingLead(lead)}>
                        <strong>{lead.name || "—"}</strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "#1E1B18" }}>{lead.phone || "—"}</span>
                      </td>
                      <td>
                        <span className="lead-dest-badge">{lead.destination || "—"}</span>
                      </td>
                      <td>{lead.travellers ? `${lead.travellers} log` : "—"}</td>
                      <td>{lead.preferred_date || "—"}</td>
                      <td>
                        <select
                          className={`status-select ${lead.status || "new"}`}
                          value={lead.status || "new"}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        >
                          <option value="new">🟡 New Lead</option>
                          <option value="contacted">🔵 Contacted</option>
                          <option value="booked">🟢 Booked</option>
                          <option value="cancelled">🔴 Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="notes-input"
                          type="text"
                          value={lead.notes || ""}
                          placeholder="Note likhein..."
                          onChange={(e) => handleNotesChange(lead.id, e.target.value)}
                        />
                      </td>
                      <td style={{ fontSize: "0.76rem", color: "#7E726A" }}>{formatDate(lead.created_at)}</td>
                      <td>
                        <div className="action-row">
                          {lead.phone && (
                            <button
                              className="wa-btn"
                              onClick={() => setSelectedLeadForWa(lead)}
                              title="Send WhatsApp message"
                            >
                              📱 WhatsApp
                            </button>
                          )}
                          <button
                            className="icon-btn"
                            onClick={() => setEditingLead(lead)}
                            title="Edit Lead"
                          >
                            ✏️
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDelete(lead.id)}
                            title="Delete Lead"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* VIEW 2: KANBAN PIPELINE VIEW */}
        {activeView === "kanban" && (
          <div className="crm-kanban">
            {STATUS_COLUMNS.map((col) => {
              const colLeads = filtered.filter((l) => (l.status || "new") === col.key);
              return (
                <div key={col.key} className="kanban-col">
                  <div className={`kanban-col-header ${col.color}`}>
                    <span>{col.label}</span>
                    <span className="kanban-badge">{colLeads.length}</span>
                  </div>

                  <div className="kanban-cards-list">
                    {colLeads.map((lead) => (
                      <div key={lead.id} className="kanban-card">
                        <div className="kanban-card-top">
                          <strong>{lead.name || "Unnamed Devotee"}</strong>
                          <span className="lead-dest-badge">{lead.destination || "Yatra"}</span>
                        </div>
                        <div className="kanban-card-phone">📞 {lead.phone || "No phone"}</div>
                        <div className="kanban-card-details">
                          <span>👥 {lead.travellers || "—"}</span>
                          <span>•</span>
                          <span>📅 {lead.preferred_date || "Dates open"}</span>
                        </div>
                        {lead.notes && (
                          <div style={{ fontSize: "0.76rem", color: "#7E726A", fontStyle: "italic" }}>
                            "{lead.notes}"
                          </div>
                        )}
                        <div className="kanban-card-actions">
                          {lead.phone && (
                            <button
                              className="wa-btn"
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                              onClick={() => setSelectedLeadForWa(lead)}
                            >
                              📱 WhatsApp
                            </button>
                          )}
                          <select
                            className={`status-select ${lead.status || "new"}`}
                            style={{ fontSize: "0.72rem", padding: "3px 6px" }}
                            value={lead.status || "new"}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          >
                            <option value="new">Move ➔ New</option>
                            <option value="contacted">Move ➔ Contacted</option>
                            <option value="booked">Move ➔ Booked</option>
                            <option value="cancelled">Move ➔ Cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "#9A8E85", fontSize: "0.8rem" }}>
                        Is column mein koi lead nahi hai
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW MANUAL LEAD */}
      {showAddModal && (
        <div className="crm-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>+ Nayi Yatra Lead Add Karein</h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Yatri Ka Naam *</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>WhatsApp / Phone Number *</label>
                  <input
                    className="crm-form-input"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Destination (Pavitra Dham)</label>
                  <select
                    className="crm-form-select"
                    value={newLeadForm.destination}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, destination: e.target.value })}
                  >
                    <option value="Ayodhya">Ayodhya Shri Ram Mandir</option>
                    <option value="Kedarnath">Kedarnath Dham</option>
                    <option value="Vaishno Devi">Mata Vaishno Devi</option>
                    <option value="Char Dham">Uttarakhand Char Dham</option>
                    <option value="Tirupati Balaji">Tirupati Balaji</option>
                    <option value="Kashi Varanasi">Kashi Vishwanath</option>
                    <option value="Mathura Vrindavan">Mathura Vrindavan</option>
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
                      value={newLeadForm.travellers}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, travellers: e.target.value })}
                    />
                  </div>
                  <div className="crm-form-group">
                    <label>Preferred Travel Date</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      placeholder="e.g. 15 May ya Agle hafte"
                      value={newLeadForm.preferred_date}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, preferred_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label>Pipeline Status</label>
                  <select
                    className="crm-form-select"
                    value={newLeadForm.status}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, status: e.target.value })}
                  >
                    <option value="new">🟡 New Lead</option>
                    <option value="contacted">🔵 Contacted</option>
                    <option value="booked">🟢 Booked</option>
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Internal Notes / Remarks</label>
                  <textarea
                    className="crm-form-textarea"
                    rows="2"
                    placeholder="e.g. Bujurgon ke liye palki suvidha chahiye, Budget ₹20K..."
                    value={newLeadForm.notes}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn primary">
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT LEAD DETAILS */}
      {editingLead && (
        <div className="crm-modal-backdrop" onClick={() => setEditingLead(null)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>✏️ Lead Details Edit Karein</h3>
              <button className="icon-btn" onClick={() => setEditingLead(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Naam</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    value={editingLead.name || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>WhatsApp / Phone</label>
                  <input
                    className="crm-form-input"
                    type="tel"
                    value={editingLead.phone || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Destination</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    value={editingLead.destination || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, destination: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="crm-form-group">
                    <label>Yatri</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      value={editingLead.travellers || ""}
                      onChange={(e) => setEditingLead({ ...editingLead, travellers: e.target.value })}
                    />
                  </div>
                  <div className="crm-form-group">
                    <label>Travel Date</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      value={editingLead.preferred_date || ""}
                      onChange={(e) => setEditingLead({ ...editingLead, preferred_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label>Status</label>
                  <select
                    className="crm-form-select"
                    value={editingLead.status || "new"}
                    onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                  >
                    <option value="new">🟡 New Lead</option>
                    <option value="contacted">🔵 Contacted</option>
                    <option value="booked">🟢 Booked</option>
                    <option value="cancelled">🔴 Cancelled</option>
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Internal Notes</label>
                  <textarea
                    className="crm-form-textarea"
                    rows="3"
                    value={editingLead.notes || ""}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn" onClick={() => setEditingLead(null)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WHATSAPP TEMPLATES */}
      {selectedLeadForWa && (
        <div className="crm-modal-backdrop" onClick={() => setSelectedLeadForWa(null)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>📱 WhatsApp Message Bhejein</h3>
              <button className="icon-btn" onClick={() => setSelectedLeadForWa(null)}>✕</button>
            </div>
            <div className="crm-modal-body">
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#5A504A" }}>
                <strong>{selectedLeadForWa.name}</strong> ({selectedLeadForWa.phone}) ko kaunsa message bhejna chahte hain?
              </p>
              <div className="wa-templates-grid">
                <div
                  className="wa-template-card"
                  onClick={() => sendWhatsAppMessage(selectedLeadForWa, "intro")}
                >
                  <strong>Template 1: Welcome & Initial Follow-up</strong>
                  <p>
                    "Namaste {selectedLeadForWa.name} ji 🙏 Aapne Yatra Saathi par {selectedLeadForWa.destination} yatra ke liye enquiry ki thi..."
                  </p>
                </div>
                <div
                  className="wa-template-card"
                  onClick={() => sendWhatsAppMessage(selectedLeadForWa, "package")}
                >
                  <strong>Template 2: Package Quotation & Inclusions</strong>
                  <p>
                    "Jai Shri Ram {selectedLeadForWa.name} ji 🙏 {selectedLeadForWa.destination} yatra package mein stay, meals aur cab shamil hai..."
                  </p>
                </div>
                <div
                  className="wa-template-card"
                  onClick={() => sendWhatsAppMessage(selectedLeadForWa, "booking")}
                >
                  <strong>Template 3: Final Booking & Confirmation</strong>
                  <p>
                    "Namaste {selectedLeadForWa.name} ji 🙏 {selectedLeadForWa.destination} yatra ke liye seats available hain, booking confirm karein..."
                  </p>
                </div>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn" onClick={() => setSelectedLeadForWa(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
