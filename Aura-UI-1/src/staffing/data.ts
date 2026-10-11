// Sample records from QuietPilot-Staffing-Inventory.zip, not live operations.
export const shifts = [
  { id: "s1", site: "Harbor House", role: "Floor captain", window: "Tonight · 16:00–00:30", needed: 2, filled: 1, status: "at-risk", lead: "Unassigned", pay: "$32/hr" },
  { id: "s2", site: "Northline HQ", role: "Drop-off runner", window: "Today · 09:30–12:00", needed: 1, filled: 1, status: "confirmed", lead: "Jules Park", pay: "$24/hr" },
  { id: "s3", site: "Glasshouse", role: "Service lead", window: "Sat · 14:00–23:00", needed: 1, filled: 0, status: "open", lead: "Open bid", pay: "$38/hr" },
  { id: "s4", site: "Keel offices", role: "Server", window: "In 12 days · 17:30–22:00", needed: 6, filled: 4, status: "filled", lead: "Sam Ortiz", pay: "$22/hr" },
  { id: "s5", site: "Studio", role: "Prep cook", window: "Fri · 08:00–13:00", needed: 2, filled: 2, status: "confirmed", lead: "Maya Chen", pay: "$26/hr" },
  { id: "s6", site: "Harbor House", role: "Bar lead", window: "Tomorrow · 15:00–23:00", needed: 1, filled: 1, status: "filled", lead: "Imani Cole", pay: "$30/hr" },
];

export const roster = [
  { id: "p1", name: "Maya Chen", role: "Ops lead", certs: ["ServSafe", "Forklift"], availability: "On floor", status: "on-shift" },
  { id: "p2", name: "Jules Park", role: "Runner", certs: ["Driver", "Allergen"], availability: "Until 12:00", status: "on-shift" },
  { id: "p3", name: "Imani Cole", role: "Bar lead", certs: ["TIPS", "ServSafe"], availability: "Tomorrow 15:00", status: "available" },
  { id: "p4", name: "Sam Ortiz", role: "Captain", certs: ["ServSafe"], availability: "Hold · Glasshouse", status: "hold" },
  { id: "p5", name: "Noah Ellis", role: "Prep", certs: ["Knife", "Allergen"], availability: "Fri AM", status: "available" },
  { id: "p6", name: "Asha Reid", role: "Server", certs: ["TIPS"], availability: "Off until Mon", status: "off" },
];

export const inventory = [
  { sku: "LIN-440", name: "Black bistro linen", category: "Soft goods", onHand: 42, par: 80, unit: "pcs", location: "Cage A", status: "critical" },
  { sku: "GLS-12", name: "Coupe glass", category: "Glass", onHand: 186, par: 160, unit: "pcs", location: "Rack 3", status: "healthy" },
  { sku: "PLT-08", name: "Matte dinner plate", category: "China", onHand: 64, par: 120, unit: "pcs", location: "Rack 1", status: "low" },
  { sku: "BAR-ICE", name: "Ice well insert", category: "Bar", onHand: 9, par: 8, unit: "pcs", location: "Cold", status: "healthy" },
  { sku: "UNI-SM", name: "Server jacket · S", category: "Uniform", onHand: 3, par: 12, unit: "pcs", location: "Locker", status: "critical" },
  { sku: "CH-GOLD", name: "Chiavari · gold", category: "Seating", onHand: 140, par: 96, unit: "pcs", location: "Yard", status: "over" },
  { sku: "NAP-IVY", name: "Napkin · ivory", category: "Soft goods", onHand: 210, par: 240, unit: "pcs", location: "Cage B", status: "low" },
  { sku: "KIT-08", name: "Service kit", category: "Tools", onHand: 18, par: 16, unit: "kits", location: "Cage A", status: "healthy" },
];

export const gap = (shift: typeof shifts[number]) => Math.max(0, shift.needed - shift.filled);
