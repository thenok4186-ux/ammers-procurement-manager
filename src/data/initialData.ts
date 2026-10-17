import type {
  ActivityLog,
  ExpenseRecord,
  GRN,
  InventoryItem,
  LaborLog,
  Project,
  PurchaseOrder,
  PurchaseRequest,
  Quotation,
  Site,
  StockMovement,
  Supplier,
} from "@/types";

export const ORG = {
  name: "MERS CONSULTING AND CONSTRUCTION PLC",
  amharicName: "መርስ ኮንሰልቲንግ እና ኮንስትራክሽን ኃ.የተ.የግ.ማ",
  short: "MERS Construction",
  logoUrl: "https://dala-prod-public-storage.s3.eu-west-1.amazonaws.com/attachments/afa6cb0a-d697-417e-8f51-772220a08892/1792188431459_1792188390063.webp",
  tin: "0004123876",
  address: "Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia",
  email: "info@mersconstruction.com",
  phone: "+251 11 667 4400",
};

export const SITES: Site[] = [
  { id: "site-central", name: "Central Warehouse", type: "Warehouse" },
  { id: "site-bole", name: "Bole Highrise Site", type: "Site" },
  { id: "site-hawassa", name: "Hawassa Industrial Site", type: "Site" },
  { id: "site-ring", name: "Ring Road Overpass Site", type: "Site" },
];

export const seedProjects: Project[] = [
  {
    id: "prj-101", code: "P-101", name: "Bole Mixed-Use Highrise",
    client: "Mers Holdings PLC", location: "Bole, Addis Ababa", status: "Active",
    startDate: "2024-02-12", endDate: "2026-08-30", allocatedBudget: 245000000,
    poCommitments: 88400000, actualExpenses: 61250000, progress: 42, manager: "Abebe Tadesse",
  },
  {
    id: "prj-102", code: "P-102", name: "Hawassa Industrial Park Expansion",
    client: "Industrial Parks Dev. Corp.", location: "Hawassa, Sidama", status: "Active",
    startDate: "2024-05-01", endDate: "2026-03-15", allocatedBudget: 172500000,
    poCommitments: 54200000, actualExpenses: 47800000, progress: 58, manager: "Marta Girma",
  },
  {
    id: "prj-103", code: "P-103", name: "Addis Ring Road Overpass",
    client: "Addis Ababa City Roads Authority", location: "Ring Road, Addis Ababa", status: "Active",
    startDate: "2023-11-20", endDate: "2025-12-10", allocatedBudget: 310000000,
    poCommitments: 141000000, actualExpenses: 128500000, progress: 67, manager: "Yonas Bekele",
  },
  {
    id: "prj-104", code: "P-104", name: "Mers Corporate HQ Fit-out",
    client: "Mers Consulting and Construction PLC", location: "Bole, Addis Ababa", status: "Planning",
    startDate: "2025-09-01", endDate: "2026-04-30", allocatedBudget: 48000000,
    poCommitments: 6500000, actualExpenses: 3100000, progress: 12, manager: "Selam Hagos",
  },
  {
    id: "prj-105", code: "P-105", name: "Dire Dawa Water Treatment Facility",
    client: "Dire Dawa Water Supply Authority", location: "Dire Dawa", status: "On Hold",
    startDate: "2024-08-05", endDate: "2026-06-20", allocatedBudget: 96000000,
    poCommitments: 22000000, actualExpenses: 19400000, progress: 25, manager: "Kebede Alemu",
  },
];

export const seedSuppliers: Supplier[] = [
  { id: "sup-01", name: "Dangote Cement Ethiopia", category: "Cement & Aggregates", contact: "Fikru Asefa", phone: "+251 911 220 118", rating: 4.7, compliance: "Compliant", tin: "0001198234" },
  { id: "sup-02", name: "Muger Cement Factory", category: "Cement & Aggregates", contact: "Hanna Tesfaye", phone: "+251 912 445 900", rating: 4.3, compliance: "Compliant", tin: "0002234517" },
  { id: "sup-03", name: "Ethiopian Steel PLC", category: "Rebar & Steel", contact: "Dawit Lemma", phone: "+251 911 884 210", rating: 4.6, compliance: "Compliant", tin: "0003348120" },
  { id: "sup-04", name: "Tikur Abay Construction Materials", category: "Cement & Aggregates", contact: "Sara Mengistu", phone: "+251 913 771 654", rating: 3.9, compliance: "Pending", tin: "0004412908" },
  { id: "sup-05", name: "Kefita MEP Supplies", category: "MEP & Electrical", contact: "Nahom Desta", phone: "+251 911 556 302", rating: 4.4, compliance: "Compliant", tin: "0005521873" },
  { id: "sup-06", name: "Addis Machinery Rentals", category: "Machinery & Equipment", contact: "Tigist Wolde", phone: "+251 914 220 776", rating: 4.1, compliance: "Compliant", tin: "0006632901" },
  { id: "sup-07", name: "Sol Safety Equipment", category: "Safety & PPE", contact: "Bereket Assefa", phone: "+251 911 330 445", rating: 4.2, compliance: "Compliant", tin: "0007741022" },
  { id: "sup-08", name: "Nyala Transport & Logistics", category: "Machinery & Equipment", contact: "Zewditu Alemu", phone: "+251 912 660 118", rating: 3.7, compliance: "Non-Compliant", tin: "0008855231" },
];

export const seedPRs: PurchaseRequest[] = [
  {
    id: "pr-1001", code: "PR-1001", projectId: "prj-101", title: "Deformed Rebar 16mm for Core Columns",
    requestedBy: "Dawit Haile (Site Engineer)", category: "Rebar & Steel", requiredDate: "2025-06-18",
    priority: "High", status: "Pending Finance", createdAt: "2025-05-28",
    justification: "Level 6 core column reinforcement scheduled per structural package S-204.",
    items: [
      { description: "Deformed steel rebar 16mm (12m)", unit: "ton", qty: 42, estPrice: 96500 },
      { description: "Deformed steel rebar 12mm (12m)", unit: "ton", qty: 18, estPrice: 94200 },
    ],
    approvals: [
      { role: "Site Engineer", by: "Dawit Haile", date: "2025-05-28", action: "Submitted" },
      { role: "Project Manager", by: "Abebe Tadesse", date: "2025-05-30", action: "Approved" },
    ],
  },
  {
    id: "pr-1002", code: "PR-1002", projectId: "prj-102", title: "OPC 42.5R Cement for Slab Casting",
    requestedBy: "Marta Girma (Project Manager)", category: "Cement & Aggregates", requiredDate: "2025-06-10",
    priority: "Urgent", status: "Approved", createdAt: "2025-05-20",
    justification: "Block C ground slab pour requires 1,800 bags to maintain the weekend casting window.",
    items: [
      { description: "OPC 42.5R cement 50kg bag", unit: "bag", qty: 1800, estPrice: 1120 },
      { description: "Washed sand (fine aggregate)", unit: "m3", qty: 220, estPrice: 1850 },
    ],
    approvals: [
      { role: "Project Manager", by: "Marta Girma", date: "2025-05-20", action: "Submitted" },
      { role: "Finance Officer", by: "Rahel Getachew", date: "2025-05-23", action: "Approved" },
    ],
  },
  {
    id: "pr-1003", code: "PR-1003", projectId: "prj-103", title: "Bridge Bearing Pads & Expansion Joints",
    requestedBy: "Yonas Bekele (Project Manager)", category: "MEP & Electrical", requiredDate: "2025-07-05",
    priority: "High", status: "Pending PM", createdAt: "2025-06-01",
    justification: "Deck erection sequence needs certified bearing pads before post-tensioning.",
    items: [
      { description: "Elastomeric bearing pad 400x500mm", unit: "unit", qty: 48, estPrice: 28400 },
      { description: "Modular expansion joint 8m section", unit: "section", qty: 12, estPrice: 71500 },
    ],
    approvals: [{ role: "Site Engineer", by: "Hirut Assefa", date: "2025-06-01", action: "Submitted" }],
  },
  {
    id: "pr-1004", code: "PR-1004", projectId: "prj-101", title: "Scaffolding & Edge Protection PPE",
    requestedBy: "Dawit Haile (Site Engineer)", category: "Safety & PPE", requiredDate: "2025-06-02",
    priority: "Medium", status: "Revision", createdAt: "2025-05-24",
    justification: "Floors 7-10 need edge protection before facade works begin.",
    items: [
      { description: "Full body safety harness c/w lanyard", unit: "unit", qty: 60, estPrice: 4200 },
      { description: "Safety helmet (vented)", unit: "unit", qty: 120, estPrice: 780 },
    ],
    approvals: [
      { role: "Site Engineer", by: "Dawit Haile", date: "2025-05-24", action: "Submitted" },
      { role: "Project Manager", by: "Abebe Tadesse", date: "2025-05-26", action: "Revision Requested" },
    ],
  },
  {
    id: "pr-1005", code: "PR-1005", projectId: "prj-104", title: "Premium Interior Finishing Package",
    requestedBy: "Selam Hagos (Project Manager)", category: "Finishing", requiredDate: "2025-08-20",
    priority: "Low", status: "Draft", createdAt: "2025-06-03",
    justification: "Executive floor porcelain tiling and acoustic ceiling specification.",
    items: [
      { description: "Porcelain floor tile 60x60cm (premium)", unit: "m2", qty: 420, estPrice: 1450 },
      { description: "Acoustic ceiling panel 600x600", unit: "m2", qty: 260, estPrice: 980 },
    ],
    approvals: [],
  },
];

export const seedQuotations: Quotation[] = [
  { id: "q-01", prId: "pr-1002", supplierId: "sup-01", unitPrice: 1085, totalPrice: 1953000 + 407000, leadTimeDays: 4, paymentTerms: "30 days", validUntil: "2025-06-25", status: "Shortlisted" },
  { id: "q-02", prId: "pr-1002", supplierId: "sup-02", unitPrice: 1098, totalPrice: 1976400 + 407000, leadTimeDays: 6, paymentTerms: "45 days", validUntil: "2025-06-22", status: "Submitted" },
  { id: "q-03", prId: "pr-1002", supplierId: "sup-04", unitPrice: 1065, totalPrice: 1917000 + 407000, leadTimeDays: 9, paymentTerms: "15 days", validUntil: "2025-06-20", status: "Submitted" },
  { id: "q-04", prId: "pr-1001", supplierId: "sup-03", unitPrice: 95200, totalPrice: 3998400 + 1695600, leadTimeDays: 5, paymentTerms: "30 days", validUntil: "2025-06-28", status: "Shortlisted" },
  { id: "q-05", prId: "pr-1001", supplierId: "sup-06", unitPrice: 97800, totalPrice: 4107600 + 1695600, leadTimeDays: 7, paymentTerms: "30 days", validUntil: "2025-06-30", status: "Submitted" },
];

export const seedPOs: PurchaseOrder[] = [
  {
    id: "po-5001", code: "PO-5001", prId: "pr-1002", supplierId: "sup-01", projectId: "prj-102",
    issueDate: "2025-05-25", deliveryDate: "2025-05-29", status: "Fulfilled",
    items: [
      { item: "OPC 42.5R cement 50kg bag", unit: "bag", qty: 1800, unitPrice: 1085 },
      { item: "Washed sand (fine aggregate)", unit: "m3", qty: 220, unitPrice: 1850 },
    ],
    subtotal: 2360000, vat: 354000, total: 2714000, terms: "Payment 30 days from acceptance. Delivery to Hawassa Industrial Site.",
  },
  {
    id: "po-5002", code: "PO-5002", prId: "pr-1001", supplierId: "sup-03", projectId: "prj-101",
    issueDate: "2025-06-02", deliveryDate: "2025-06-09", status: "In Transit",
    items: [
      { item: "Deformed steel rebar 16mm (12m)", unit: "ton", qty: 42, unitPrice: 95200 },
      { item: "Deformed steel rebar 12mm (12m)", unit: "ton", qty: 18, unitPrice: 94200 },
    ],
    subtotal: 5694000, vat: 854100, total: 6548100, terms: "Payment 30 days from acceptance. Delivery to Bole Highrise Site laydown area.",
  },
  {
    id: "po-5003", code: "PO-5003", prId: "pr-1003", supplierId: "sup-05", projectId: "prj-103",
    issueDate: "2025-06-05", deliveryDate: "2025-06-20", status: "Issued",
    items: [
      { item: "Elastomeric bearing pad 400x500mm", unit: "unit", qty: 48, unitPrice: 27950 },
      { item: "Modular expansion joint 8m section", unit: "section", qty: 12, unitPrice: 70800 },
    ],
    subtotal: 2191200, vat: 328680, total: 2519880, terms: "Payment 45 days. Bearing pads to carry mill certificates on delivery.",
  },
];

export const seedGRNs: GRN[] = [
  {
    id: "grn-01", code: "GRN-01", poId: "po-5001", date: "2025-05-29", receivedBy: "Bekele Mulu (Storekeeper)",
    inspectedBy: "Hirut Assefa (Site Engineer)", status: "Accepted", siteId: "site-hawassa",
    remark: "Full delivery accepted. Cement bags intact with mill test certificates attached.",
    items: [
      { description: "OPC 42.5R cement 50kg bag", orderedQty: 1800, acceptedQty: 1800, rejectedQty: 0, remark: "Sealed, dry" },
      { description: "Washed sand (fine aggregate)", orderedQty: 220, acceptedQty: 220, rejectedQty: 0, remark: "Sieve check passed" },
    ],
  },
];

export const seedInventory: InventoryItem[] = [
  { id: "inv-01", code: "MAT-RB16", name: "Deformed Rebar 16mm (12m)", category: "Rebar & Steel", unit: "ton", siteId: "site-bole", quantity: 26, reorderLevel: 15, unitCost: 95200, location: "Bole Laydown A1" },
  { id: "inv-02", code: "MAT-RB12", name: "Deformed Rebar 12mm (12m)", category: "Rebar & Steel", unit: "ton", siteId: "site-bole", quantity: 9, reorderLevel: 12, unitCost: 94200, location: "Bole Laydown A2" },
  { id: "inv-03", code: "MAT-CEM42", name: "OPC 42.5R Cement 50kg", category: "Cement & Aggregates", unit: "bag", siteId: "site-hawassa", quantity: 1840, reorderLevel: 600, unitCost: 1085, location: "Hawassa Silo Bay 2" },
  { id: "inv-04", code: "MAT-SAND", name: "Washed Sand (Fine Aggregate)", category: "Cement & Aggregates", unit: "m3", siteId: "site-hawassa", quantity: 240, reorderLevel: 100, unitCost: 1850, location: "Hawassa Stockpile" },
  { id: "inv-05", code: "EQP-CRUSH20", name: "Coarse Aggregate 20mm", category: "Cement & Aggregates", unit: "m3", siteId: "site-ring", quantity: 68, reorderLevel: 120, unitCost: 2100, location: "Ring Road Stockpile B" },
  { id: "inv-06", code: "MEP-PVC110", name: "PVC Drainage Pipe 110mm", category: "MEP & Electrical", unit: "length", siteId: "site-central", quantity: 320, reorderLevel: 150, unitCost: 640, location: "Central Rack C4" },
  { id: "inv-07", code: "MEP-CBL16", name: "Copper Cable 16mm2 (100m)", category: "MEP & Electrical", unit: "roll", siteId: "site-central", quantity: 44, reorderLevel: 30, unitCost: 12800, location: "Central Rack E1" },
  { id: "inv-08", code: "SAF-HARN", name: "Full Body Safety Harness", category: "Safety & PPE", unit: "unit", siteId: "site-bole", quantity: 34, reorderLevel: 40, unitCost: 4200, location: "Bole Safety Store" },
  { id: "inv-09", code: "SAF-HLMT", name: "Safety Helmet (Vented)", category: "Safety & PPE", unit: "unit", siteId: "site-ring", quantity: 96, reorderLevel: 60, unitCost: 780, location: "Ring Road Safety Store" },
  { id: "inv-10", code: "MCH-GEN80", name: "Diesel Generator 80kVA", category: "Machinery & Equipment", unit: "unit", siteId: "site-central", quantity: 4, reorderLevel: 2, unitCost: 745000, location: "Central Equipment Yard" },
  { id: "inv-11", code: "MCH-VIB", name: "Concrete Poker Vibrator", category: "Machinery & Equipment", unit: "unit", siteId: "site-bole", quantity: 6, reorderLevel: 4, unitCost: 38500, location: "Bole Equipment Store" },
  { id: "inv-12", code: "MAT-TILE60", name: "Porcelain Floor Tile 60x60", category: "Finishing", unit: "m2", siteId: "site-central", quantity: 118, reorderLevel: 80, unitCost: 1450, location: "Central Rack F2" },
];

export const seedMovements: StockMovement[] = [
  { id: "mv-01", date: "2025-05-29", itemId: "inv-03", type: "Receipt", qty: 1800, fromSite: "sup-01", toSite: "site-hawassa", by: "Bekele Mulu", note: "GRN-01 against PO-5001" },
  { id: "mv-02", date: "2025-05-31", itemId: "inv-04", type: "Receipt", qty: 220, fromSite: "sup-01", toSite: "site-hawassa", by: "Bekele Mulu", note: "GRN-01 aggregate receipt" },
  { id: "mv-03", date: "2025-06-01", itemId: "inv-01", type: "Issuance", qty: 8, fromSite: "site-bole", toSite: "site-bole", by: "Bekele Mulu", note: "Issued to subcontractor for Level 6 core" },
  { id: "mv-04", date: "2025-06-02", itemId: "inv-08", type: "Transfer", qty: 12, fromSite: "site-central", toSite: "site-ring", by: "Bekele Mulu", note: "Safety harness top-up to Ring Road" },
];

export const seedLabor: LaborLog[] = [
  { id: "lb-01", date: "2025-06-02", projectId: "prj-101", workerName: "Girma Wolde", trade: "Masonry", role: "Lead Mason", dayRate: 950, days: 1, overtime: 2 },
  { id: "lb-02", date: "2025-06-02", projectId: "prj-101", workerName: "Tesfaye Alemu", trade: "Carpentry", role: "Formwork Carpenter", dayRate: 880, days: 1, overtime: 0 },
  { id: "lb-03", date: "2025-06-02", projectId: "prj-102", workerName: "Alem Haile", trade: "Steel Fixing", role: "Steel Fixer", dayRate: 900, days: 1, overtime: 3 },
  { id: "lb-04", date: "2025-06-03", projectId: "prj-103", workerName: "Kassahun Desta", trade: "Machine Ops", role: "Excavator Operator", dayRate: 1450, days: 1, overtime: 0 },
  { id: "lb-05", date: "2025-06-03", projectId: "prj-101", workerName: "Mulu Tesema", trade: "Masonry", role: "Mason", dayRate: 800, days: 1, overtime: 0 },
  { id: "lb-06", date: "2025-06-03", projectId: "prj-102", workerName: "Bekele Kassa", trade: "Steel Fixing", role: "Steel Fixer", dayRate: 900, days: 1, overtime: 1 },
];

export const seedExpenses: ExpenseRecord[] = [
  { id: "ex-01", date: "2025-06-01", projectId: "prj-101", category: "Equipment Hire", description: "Tower crane monthly rental", amount: 415000, voucher: "VCH-2201", recordedBy: "Selam Hagos" },
  { id: "ex-02", date: "2025-06-02", projectId: "prj-102", category: "Fuel & Transport", description: "Diesel for site generator & pumps", amount: 168400, voucher: "VCH-2202", recordedBy: "Marta Girma" },
  { id: "ex-03", date: "2025-06-03", projectId: "prj-103", category: "Petty Cash", description: "Site consumables and small tools", amount: 32400, voucher: "VCH-2203", recordedBy: "Yonas Bekele" },
  { id: "ex-04", date: "2025-06-04", projectId: "prj-101", category: "Subcontract", description: "Facade scaffolding subcontract installment", amount: 610000, voucher: "VCH-2204", recordedBy: "Abebe Tadesse" },
];

export const seedActivity: ActivityLog[] = [
  { id: "ac-01", timestamp: "2025-06-05 09:14", actor: "Rahel Getachew", action: "Approved", detail: "PR-1002 moved to Approved after finance review." },
  { id: "ac-02", timestamp: "2025-06-04 16:40", actor: "Abebe Tadesse", action: "Revision Requested", detail: "PR-1004 returned for updated PPE specification." },
  { id: "ac-03", timestamp: "2025-06-02 11:05", actor: "Nahom Desta", action: "PO Issued", detail: "PO-5003 issued to Kefita MEP Supplies." },
  { id: "ac-04", timestamp: "2025-05-29 14:22", actor: "Bekele Mulu", action: "GRN Accepted", detail: "GRN-01 accepted 1,800 cement bags at Hawassa." },
];

export interface AppState {
  projects: Project[];
  prs: PurchaseRequest[];
  quotations: Quotation[];
  pos: PurchaseOrder[];
  suppliers: Supplier[];
  grns: GRN[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  labor: LaborLog[];
  expenses: ExpenseRecord[];
  activity: ActivityLog[];
}

export const initialState: AppState = {
  projects: seedProjects,
  prs: seedPRs,
  quotations: seedQuotations,
  pos: seedPOs,
  suppliers: seedSuppliers,
  grns: seedGRNs,
  inventory: seedInventory,
  movements: seedMovements,
  labor: seedLabor,
  expenses: seedExpenses,
  activity: seedActivity,
};

const DB_KEY = "ammers-erp-state-v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable, keep in-memory state */
  }
}

/* ------------------------------------------------------------------ */
/*  Administrator reset / clear-history helpers.                       */
/*  All return a brand-new AppState so callers can setState directly.  */
/* ------------------------------------------------------------------ */

/** Re-seed the portal with the original demo dataset. */
export function resetToSeedState(): AppState {
  return {
    projects: seedProjects.map((p) => ({ ...p })),
    prs: seedPRs.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })), approvals: p.approvals.map((a) => ({ ...a })) })),
    quotations: seedQuotations.map((q) => ({ ...q })),
    pos: seedPOs.map((p) => ({ ...p, items: p.items.map((i) => ({ ...i })) })),
    suppliers: seedSuppliers.map((s) => ({ ...s })),
    grns: seedGRNs.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) })),
    inventory: seedInventory.map((i) => ({ ...i })),
    movements: seedMovements.map((m) => ({ ...m })),
    labor: seedLabor.map((l) => ({ ...l })),
    expenses: seedExpenses.map((e) => ({ ...e })),
    activity: seedActivity.map((a) => ({ ...a })),
  };
}

/** Blank slate: every collection emptied for live data entry. */
export function createFreshBlankState(): AppState {
  return {
    projects: [],
    prs: [],
    quotations: [],
    pos: [],
    suppliers: [],
    grns: [],
    inventory: [],
    movements: [],
    labor: [],
    expenses: [],
    activity: [],
  };
}

/** Wipe transactional records (PRs, RFQs, POs, GRNs, labour, expenses,
 *  stock movements) but keep master projects, suppliers and inventory. */
export function clearHistoryOnly(state: AppState): AppState {
  return {
    ...state,
    prs: [],
    quotations: [],
    pos: [],
    grns: [],
    labor: [],
    expenses: [],
    movements: [],
    activity: [],
    projects: state.projects.map((p) => ({ ...p, poCommitments: 0, actualExpenses: 0, progress: 0 })),
  };
}

/** Wipe the audit / activity trail only; all records stay intact. */
export function clearAuditLogsOnly(state: AppState): AppState {
  return { ...state, activity: [] };
}

export const CATEGORIES = [
  "Cement & Aggregates",
  "Rebar & Steel",
  "MEP & Electrical",
  "Machinery & Equipment",
  "Safety & PPE",
  "Finishing",
] as const;

export const TRADES = [
  "Masonry",
  "Carpentry",
  "Steel Fixing",
  "MEP",
  "Machine Ops",
  "General Labour",
] as const;

export const EXPENSE_CATEGORIES = [
  "Petty Cash",
  "Fuel & Transport",
  "Equipment Hire",
  "Subcontract",
  "Site Utilities",
] as const;