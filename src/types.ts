export type Role =
  | "CEO"
  | "Operations Manager"
  | "Human Resources"
  | "Construction Manager"
  | "Project Manager"
  | "Office Engineer"
  | "Finance"
  | "Procurement"
  | "Architecture"
  | "Reception";

export type ViewKey =
  | "dashboard"
  | "projects"
  | "procurement"
  | "inventory"
  | "labor"
  | "reports";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  startDate: string;
  endDate: string;
  allocatedBudget: number;
  poCommitments: number;
  actualExpenses: number;
  progress: number;
  manager: string;
}

export interface POLine {
  item: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

export interface PRItem {
  description: string;
  unit: string;
  qty: number;
  estPrice: number;
}

export interface ApprovalStep {
  role: Role | string;
  by: string;
  date: string;
  action: "Submitted" | "Approved" | "Rejected" | "Revision Requested";
}

export interface PurchaseRequest {
  id: string;
  code: string;
  projectId: string;
  title: string;
  requestedBy: string;
  category: string;
  requiredDate: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Draft" | "Pending PM" | "Pending Finance" | "Approved" | "Rejected" | "Revision";
  items: PRItem[];
  createdAt: string;
  justification: string;
  approvals: ApprovalStep[];
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  rating: number;
  compliance: "Compliant" | "Pending" | "Non-Compliant";
  tin: string;
}

export interface Quotation {
  id: string;
  prId: string;
  supplierId: string;
  unitPrice: number;
  totalPrice: number;
  leadTimeDays: number;
  paymentTerms: string;
  validUntil: string;
  status: "Submitted" | "Shortlisted" | "Awarded" | "Rejected";
}

export interface PurchaseOrder {
  id: string;
  code: string;
  prId: string;
  supplierId: string;
  projectId: string;
  issueDate: string;
  deliveryDate: string;
  status: "Draft" | "Issued" | "In Transit" | "Partially Delivered" | "Fulfilled";
  items: POLine[];
  subtotal: number;
  vat: number;
  total: number;
  terms: string;
}

export interface GRNItem {
  description: string;
  orderedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  remark: string;
}

export interface GRN {
  id: string;
  code: string;
  poId: string;
  date: string;
  receivedBy: string;
  inspectedBy: string;
  items: GRNItem[];
  status: "Inspection" | "Accepted" | "Partial" | "Rejected";
  siteId: string;
  remark: string;
}

export interface Site {
  id: string;
  name: string;
  type: "Warehouse" | "Site";
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  siteId: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  location: string;
}

export interface StockMovement {
  id: string;
  date: string;
  itemId: string;
  type: "Issuance" | "Transfer" | "Receipt";
  qty: number;
  fromSite: string;
  toSite: string;
  by: string;
  note: string;
}

export interface LaborLog {
  id: string;
  date: string;
  projectId: string;
  workerName: string;
  trade: string;
  role: string;
  dayRate: number;
  days: number;
  overtime: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  projectId: string;
  category: string;
  description: string;
  amount: number;
  voucher: string;
  recordedBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

/* Admin system reset operations (Administrator-only destructive controls). */
export type ResetMode = "fresh" | "seed" | "history" | "audit";

export interface ResetRecordCounts {
  projects: number;
  prs: number;
  quotations: number;
  pos: number;
  grns: number;
  inventory: number;
  movements: number;
  labor: number;
  expenses: number;
  activity: number;
}