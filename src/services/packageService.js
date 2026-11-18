/**
 * ============================================================================
 * YATRA SAATHI — PACKAGES SERVICE
 * Organiser packages catalog with local persistence & bot synchronization
 * ============================================================================
 */

export const INITIAL_PACKAGES = [
  {
    id: "ayodhya",
    name: "Ayodhya Shri Ram Dham",
    hindi: "Ram Lalla Darshan & Saryu Aarti",
    days: "2 Din · 1 Raat",
    price: "₹3,999",
    from: "Delhi / Lucknow",
    icon: "ॐ",
    inclusions: ["3★ Hotel Stay", "Satvik Meals", "AC Cab Pickup", "VIP Darshan Assist"],
    status: "active"
  },
  {
    id: "kedarnath",
    name: "Kedarnath & Badrinath",
    hindi: "Do Dham Himalayan Darshan",
    days: "6 Din · 5 Raat",
    price: "₹14,999",
    from: "Haridwar / Rishikesh",
    icon: "🏔️",
    inclusions: ["Guesthouse / Hotel", "All Meals", "Hill Transport", "Helicopter Booking Support"],
    status: "active"
  },
  {
    id: "vaishno",
    name: "Mata Vaishno Devi",
    hindi: "Katra Pavitra Bhawan Yatra",
    days: "4 Din · 3 Raat",
    price: "₹8,499",
    from: "Jammu / Katra",
    icon: "🌸",
    inclusions: ["Katra Luxury Stay", "Jammu Pickup & Drop", "Yatra RFID Support", "Bhairon Baba Cable Car"],
    status: "active"
  },
  {
    id: "chardham",
    name: "Uttarakhand Char Dham",
    hindi: "Yamunotri, Gangotri, Kedarnath, Badrinath",
    days: "10 Din · 9 Raat",
    price: "₹24,999",
    from: "Haridwar se Haridwar",
    icon: "✨",
    inclusions: ["Complete Route Hotels", "Breakfast & Dinner", "2x2 Deluxe Bus/Tempo", "Biometric Registration"],
    status: "active"
  },
  {
    id: "tirupati",
    name: "Tirupati Balaji Darshan",
    hindi: "Sri Venkateswara Swamy Yatra",
    days: "3 Din · 2 Raat",
    price: "₹9,999",
    from: "Chennai / Bangalore",
    icon: "🚩",
    inclusions: ["Tirupati 4★ Stay", "SED ₹300 Pass Support", "Private AC Cab", "Laddu Prasadam Assistance"],
    status: "active"
  },
  {
    id: "kashi",
    name: "Kashi Vishwanath & Ayodhya",
    hindi: "Varanasi Ganga Aarti & Ram Mandir Combo",
    days: "4 Din · 3 Raat",
    price: "₹8,999",
    from: "Varanasi Airport / Junction",
    icon: "🔱",
    inclusions: ["Riverfront Hotel", "Ganga Boat Ride", "Kashi Corridor Pass", "Ayodhya Day Excursion"],
    status: "active"
  }
];

const STORAGE_KEY = "yatra_crm_packages";

export function fetchPackages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PACKAGES));
      return INITIAL_PACKAGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PACKAGES;
  }
}

export function savePackage(tour) {
  const current = fetchPackages();
  const existingIdx = current.findIndex((p) => p.id === tour.id);

  let updated;
  if (existingIdx !== -1) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...tour };
  } else {
    const newTour = {
      ...tour,
      id: tour.id || `tour-${Date.now()}`,
      status: tour.status || "active",
      inclusions: Array.isArray(tour.inclusions) ? tour.inclusions : ["Hotel Stay", "Satvik Meals", "Transport"],
    };
    updated = [newTour, ...current];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deletePackage(id) {
  const current = fetchPackages();
  const filtered = current.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

export function resetPackages() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PACKAGES));
  return INITIAL_PACKAGES;
}

