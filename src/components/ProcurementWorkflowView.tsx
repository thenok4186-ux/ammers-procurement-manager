import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ClipboardText,
  FileText,
  Funnel,
  PaperPlaneTilt,
  Plus,
  Printer,
  Scales,
  SealCheck,
  Truck,
  X,
} from "@phosphor-icons/react";
import type { POLine, Project, PurchaseOrder, PurchaseRequest, Quotation, Role, Supplier } from "@/types";
import {
  Chip,
  CompanyBlock,
  DocShell,
  SectionHeader,
  Stat,
  can,
  fmtETB,
  todayISO,
} from "@/components/NavbarAndRoleHeader";
import { CATEGORIES } from "@/data/initialData";

interface Props {
  role: Role;
  prs: PurchaseRequest[];
  pos: PurchaseOrder[];
  quotations: Quotation[];
  suppliers: Supplier[];
  projects: Project[];
  projectFilter: string;
  onCreatePR: (pr: PurchaseRequest) => void;
  onUpdatePR: (pr: PurchaseRequest) => void;
  onAddQuotation: (q: Quotation) => void;
  onAward: (prId: string, quotationId: string) => void;
  onGeneratePO: (po: PurchaseOrder) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  logActivity: (action: string, detail: string) => void;
}

type Tab = "requests" | "quotations" | "orders";
type Doc = { kind: "pr"; pr: PurchaseRequest } | { kind: "po"; po: PurchaseOrder };

const PO_FLOW: PurchaseOrder["status"][] = ["Draft", "Issued", "In Transit", "Partially Delivered", "Fulfilled"];

const prTotal = (pr: PurchaseRequest) => pr.items.reduce((s, i) => s + i.qty * i.estPrice, 0);

const emptyItem = { description: "", unit: "unit", qty: "", estPrice: "" };

export default function ProcurementWorkflowView({
  role, prs, pos, quotations, suppliers, projects, projectFilter,
  onCreatePR, onUpdatePR, onAddQuotation, onAward, onGeneratePO, onUpdatePO, logActivity,
}: Props) {
  const [tab, setTab] = useState<Tab>("requests");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [prOpen, setPrOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const scoped = useMemo(
    () => (projectFilter === "all" ? prs : prs.filter((p) => p.projectId === projectFilter)),
    [prs, projectFilter],
  );
  const scopedPos = useMemo(
    () => (projectFilter === "all" ? pos : pos.filter((p) => p.projectId === projectFilter)),
    [pos, projectFilter],
  );

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Unassigned";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "Unknown supplier";
  const supplier = (id: string) => suppliers.find((s) => s.id === id);

  const statuses = useMemo(() => Array.from(new Set(scoped.map((p) => p.status))), [scoped]);
  const visiblePRs = statusFilter === "all" ? scoped : scoped.filter((p) => p.status === statusFilter);

  const approvedPRs = scoped.filter((p) => p.status === "Approved");
  const activePR = approvedPRs.find((p) => p.id === selectedPR) ?? approvedPRs[0];
  const activeQuotes = activePR ? quotations.filter((q) => q.prId === activePR.id) : [];
  const minQuote = activeQuotes.length ? Math.min(...activeQuotes.map((q) => q.totalPrice)) : 0;

  const [form, setForm] = useState({
    title: "", projectId: projects[0]?.id ?? "", category: CATEGORIES[0] as string,
    requiredDate: todayISO(), priority: "Medium", justification: "",
    items: [{ ...emptyItem }, { ...emptyItem }],
  });
  const [poForm, setPoForm] = useState({ supplierId: suppliers[0]?.id ?? "", deliveryDate: todayISO(), terms: "Payment 30 days from acceptance." });

  /* ------------------------------ PR lifecycle ------------------------------ */
  const step = (pr: PurchaseRequest, action: "Approved" | "Rejected" | "Revision Requested") => {
    const next: PurchaseRequest["status"] =
      action === "Rejected" ? "Rejected" : action === "Revision Requested" ? "Revision"
        : pr.status === "Pending PM" ? "Pending Finance" : "Approved";
    onUpdatePR({ ...pr, status: next, approvals: [...pr.approvals, { role, by: role, date: todayISO(), action }] });
    logActivity(action, `${pr.code} → ${next} by ${role}`);
    toast.success(`${pr.code} ${action.toLowerCase()}`);
  };

  const submitPR = (pr: PurchaseRequest) => {
    onUpdatePR({ ...pr, status: "Pending PM", approvals: [...pr.approvals, { role, by: role, date: todayISO(), action: "Submitted" }] });
    logActivity("Submitted", `${pr.code} submitted for PM approval`);
    toast.success(`${pr.code} submitted to Project Manager`);
  };

  const createPR = () => {
    const items = form.items.filter((i) => i.description.trim() && Number(i.qty) > 0);
    if (!form.title.trim() || items.length === 0) {
      toast.error("Provide a title and at least one material line");
      return;
    }
    const seq = 1000 + prs.length + 1;
    const pr: PurchaseRequest = {
      id: `pr-${seq}`, code: `PR-${seq}`, projectId: form.projectId, title: form.title.trim(),
      requestedBy: `${role}`, category: form.category, requiredDate: form.requiredDate,
      priority: form.priority as PurchaseRequest["priority"], status: "Pending PM", createdAt: todayISO(),
      justification: form.justification.trim() || "Site requirement per construction schedule.",
      items: items.map((i) => ({ description: i.description.trim(), unit: i.unit, qty: Number(i.qty), estPrice: Number(i.estPrice) || 0 })),
      approvals: [{ role, by: role, date: todayISO(), action: "Submitted" }],
    };
    onCreatePR(pr);
    logActivity("PR Created", `${pr.code} raised for ${projectName(pr.projectId)}`);
    toast.success(`${pr.code} created and routed to Project Manager`);
    setPrOpen(false);
    setForm({ ...form, title: "", justification: "", items: [{ ...emptyItem }, { ...emptyItem }] });
  };

  const awardQuote = (q: Quotation) => {
    if (!activePR) return;
    onAward(activePR.id, q.id);
    toast.success(`${supplierName(q.supplierId)} awarded ${activePR.code}`);
    setTab("orders");
  };

  const generatePO = () => {
    if (!activePR) return;
    const items: POLine[] = activePR.items.map((i) => ({ item: i.description, unit: i.unit, qty: i.qty, unitPrice: i.estPrice }));
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const vat = Math.round(subtotal * 0.15);
    const seq = 5000 + pos.length + 1;
    const po: PurchaseOrder = {
      id: `po-${seq}`, code: `PO-${seq}`, prId: activePR.id, supplierId: poForm.supplierId,
      projectId: activePR.projectId, issueDate: todayISO(), deliveryDate: poForm.deliveryDate,
      status: "Issued", items, subtotal, vat, total: subtotal + vat, terms: poForm.terms,
    };
    onGeneratePO(po);
    logActivity("PO Issued", `${po.code} issued to ${supplierName(po.supplierId)} against ${activePR.code}`);
    toast.success(`${po.code} issued to ${supplierName(po.supplierId)}`);
    setPoOpen(false);
    setTab("orders");
  };

  const advance = (po: PurchaseOrder) => {
    const idx = PO_FLOW.indexOf(po.status);
    if (idx >= PO_FLOW.length - 1) { toast.info(`${po.code} is already fulfilled`); return; }
    const next = PO_FLOW[idx + 1];
    onUpdatePO({ ...po, status: next });
    logActivity("PO Updated", `${po.code} advanced to ${next}`);
    toast.success(`${po.code} → ${next}`);
  };

  const input = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "requests", label: "Purchase Requests", icon: <ClipboardText className="h-4 w-4" weight="duotone" /> },
    { key: "quotations", label: "Quotation Matrix", icon: <Scales className="h-4 w-4" weight="duotone" /> },
    { key: "orders", label: "Purchase Orders", icon: <Truck className="h-4 w-4" weight="duotone" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open Requests" value={`${scoped.filter((p) => p.status.startsWith("Pending")).length}`} sub={`${scoped.length} total PRs`} icon={<ClipboardText className="h-4 w-4" weight="duotone" />} tone="amber" />
        <Stat label="Approved for PO" value={`${approvedPRs.length}`} sub="Ready to procure" icon={<SealCheck className="h-4 w-4" weight="duotone" />} tone="emerald" />
        <Stat label="Active POs" value={`${scopedPos.filter((p) => p.status !== "Fulfilled").length}`} sub={fmtETB(scopedPos.reduce((s, p) => s + p.total, 0))} icon={<Truck className="h-4 w-4" weight="duotone" />} tone="sky" />
        <Stat label="Quotes on File" value={`${quotations.length}`} sub={`${suppliers.length} registered vendors`} icon={<Scales className="h-4 w-4" weight="duotone" />} tone="violet" />
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/70 bg-card p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === t.key ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === t.key ? <motion.span layoutId="proc-tab" className="absolute inset-0 rounded-lg bg-amber-500/15 ring-1 ring-inset ring-amber-500/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} /> : null}
            <span className="relative">{t.icon}</span><span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <>
          <SectionHeader title="Purchase Requests" subtitle="Site material requests with multi-step approval routing">
            <div className="relative flex items-center">
              <Funnel className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-card pl-8 pr-2 text-xs font-medium outline-none focus:border-amber-500">
                <option value="all">All statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {can(role, "createPR") ? (
              <button onClick={() => setPrOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">
                <Plus className="h-4 w-4" weight="bold" /> Raise Request
              </button>
            ) : null}
          </SectionHeader>

          <div className="grid grid-cols-1 gap-3">
            {visiblePRs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No purchase requests match the current filter.</div>
            ) : visiblePRs.map((pr) => (
              <motion.div key={pr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{pr.code}</span>
                      <Chip label={pr.status} />
                      <Chip label={pr.priority} />
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-foreground">{pr.title}</h3>
                    <p className="text-xs text-muted-foreground">{projectName(pr.projectId)} · {pr.category} · required {pr.requiredDate}</p>
                    <p className="mt-1 max-w-[70ch] text-xs text-muted-foreground">{pr.justification}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold tabular-nums text-foreground">{fmtETB(prTotal(pr))}</p>
                    <p className="text-[11px] text-muted-foreground">est. value · {pr.items.length} line(s)</p>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-1.5 font-semibold">Description</th><th className="px-3 py-1.5 text-right font-semibold">Qty</th><th className="px-3 py-1.5 font-semibold">Unit</th><th className="px-3 py-1.5 text-right font-semibold">Est. Rate</th><th className="px-3 py-1.5 text-right font-semibold">Amount</th></tr></thead>
                    <tbody className="divide-y divide-border/60">
                      {pr.items.map((it, i) => (
                        <tr key={i}><td className="px-3 py-1.5 text-foreground">{it.description}</td><td className="px-3 py-1.5 text-right font-mono tabular-nums">{it.qty}</td><td className="px-3 py-1.5 text-muted-foreground">{it.unit}</td><td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmtETB(it.estPrice)}</td><td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmtETB(it.qty * it.estPrice)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    {pr.approvals.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Check className="h-3 w-3 text-emerald-500" weight="bold" /> {a.action} · {a.role}
                      </span>
                    ))}
                    {pr.approvals.length === 0 ? <span>No approval actions yet</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setDoc({ kind: "pr", pr })} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"><Printer className="h-3.5 w-3.5" /> Print PR</button>
                    {pr.status === "Draft" && can(role, "createPR") ? (
                      <button onClick={() => submitPR(pr)} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"><PaperPlaneTilt className="h-3.5 w-3.5" /> Submit</button>
                    ) : null}
                    {pr.status === "Pending PM" && can(role, "approvePM") ? (
                      <>
                        <button onClick={() => step(pr, "Approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"><Check className="h-3.5 w-3.5" weight="bold" /> Approve</button>
                        <button onClick={() => step(pr, "Revision Requested")} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-500/10">Request Revision</button>
                        <button onClick={() => step(pr, "Rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10"><X className="h-3.5 w-3.5" weight="bold" /> Reject</button>
                      </>
                    ) : null}
                    {pr.status === "Pending Finance" && can(role, "approveFinance") ? (
                      <>
                        <button onClick={() => step(pr, "Approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"><Check className="h-3.5 w-3.5" weight="bold" /> Approve Funding</button>
                        <button onClick={() => step(pr, "Rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10"><X className="h-3.5 w-3.5" weight="bold" /> Reject</button>
                      </>
                    ) : null}
                    {pr.status === "Approved" && can(role, "awardPO") ? (
                      <button onClick={() => { setSelectedPR(pr.id); setTab("quotations"); }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700">Procure <ArrowRight className="h-3.5 w-3.5" weight="bold" /></button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : null}

      {tab === "quotations" ? (
        <>
          <SectionHeader title="RFQ Comparison Matrix" subtitle="Evaluate vendor bids side-by-side and award the winning supplier">
            <select value={activePR?.id ?? ""} onChange={(e) => setSelectedPR(e.target.value)} className="h-9 max-w-[280px] rounded-lg border border-input bg-card px-2 text-xs font-medium outline-none focus:border-amber-500">
              {approvedPRs.length === 0 ? <option value="">No approved PRs</option> : approvedPRs.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
            </select>
            {activePR && can(role, "awardPO") ? (
              <button onClick={() => setDoc({ kind: "pr", pr: activePR })} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"><FileText className="h-3.5 w-3.5" /> PR document</button>
            ) : null}
          </SectionHeader>

          {!activePR ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No approved purchase request available for quotation comparison yet.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{activePR.code} · {activePR.title}</p>
                <p className="text-xs text-muted-foreground">Required by {activePR.requiredDate} · {activePR.items.length} line(s) · est. {fmtETB(prTotal(activePR))}</p>
              </div>
              {activeQuotes.length === 0 ? (
                <div className="p-6">
                  <p className="mb-3 text-sm text-muted-foreground">No vendor quotations on file for this request.</p>
                  {can(role, "manageSuppliers") ? (
                    <div className="flex flex-wrap gap-2">
                      {suppliers.slice(0, 3).map((s) => (
                        <button key={s.id} onClick={() => { onAddQuotation({ id: `q-${Date.now()}-${s.id}`, prId: activePR.id, supplierId: s.id, unitPrice: activePR.items[0]?.estPrice ?? 0, totalPrice: Math.round(prTotal(activePR) * (0.95 + Math.random() * 0.15)), leadTimeDays: 4 + Math.floor(Math.random() * 8), paymentTerms: "30 days", validUntil: todayISO(), status: "Submitted" }); toast.success(`Quotation requested from ${s.name}`); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"><PaperPlaneTilt className="h-3.5 w-3.5" /> Request quote · {s.name}</button>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Procurement role required to issue RFQs.</p>}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Vendor</th>
                        <th className="px-4 py-2 text-right font-semibold">Unit Rate</th>
                        <th className="px-4 py-2 text-right font-semibold">Total Bid</th>
                        <th className="px-4 py-2 text-right font-semibold">Lead Time</th>
                        <th className="px-4 py-2 font-semibold">Payment Terms</th>
                        <th className="px-4 py-2 font-semibold">Rating</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                        <th className="px-4 py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {activeQuotes.map((q) => {
                        const s = supplier(q.supplierId);
                        const best = q.totalPrice === minQuote;
                        return (
                          <tr key={q.id} className={`transition hover:bg-muted/40 ${best ? "bg-emerald-500/5" : ""}`}>
                            <td className="px-4 py-2.5"><span className="font-medium text-foreground">{s?.name ?? "Vendor"}</span><span className="block text-[11px] text-muted-foreground">{s?.category} · TIN {s?.tin}</span></td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{fmtETB(q.unitPrice)}</td>
                            <td className={`px-4 py-2.5 text-right font-mono font-semibold tabular-nums ${best ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{fmtETB(q.totalPrice)}{best ? <span className="ml-1 text-[10px] font-bold uppercase">lowest</span> : null}</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{q.leadTimeDays}d</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{q.paymentTerms}</td>
                            <td className="px-4 py-2.5"><span className="font-mono">{s?.rating.toFixed(1)}</span> <span className="text-muted-foreground">/ 5</span></td>
                            <td className="px-4 py-2.5"><Chip label={q.status} /></td>
                            <td className="px-4 py-2.5">
                              {can(role, "awardPO") && q.status !== "Awarded" ? (
                                <button onClick={() => awardQuote(q)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Award PO</button>
                              ) : <span className="text-[11px] text-muted-foreground">{q.status === "Awarded" ? "Awarded" : "Locked"}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activePR && can(role, "awardPO") && activeQuotes.length > 0 ? (
                <div className="flex justify-end border-t border-border px-4 py-3">
                  <button onClick={() => setPoOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 px-3.5 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-500/10">Generate PO manually <ArrowRight className="h-3.5 w-3.5" weight="bold" /></button>
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : null}

      {tab === "orders" ? (
        <>
          <SectionHeader title="Purchase Orders" subtitle="PO lifecycle from issue through delivery fulfilment" />
          {scopedPos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No purchase orders issued in this view.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {scopedPos.map((po) => (
                <motion.div key={po.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{po.code}</span>
                        <Chip label={po.status} />
                        <span className="text-[11px] text-muted-foreground">from {prs.find((p) => p.id === po.prId)?.code ?? "ad-hoc"}</span>
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{supplierName(po.supplierId)}</h3>
                      <p className="text-xs text-muted-foreground">{projectName(po.projectId)} · issued {po.issueDate} · delivery {po.deliveryDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold tabular-nums text-foreground">{fmtETB(po.total)}</p>
                      <p className="text-[11px] text-muted-foreground">incl. VAT {fmtETB(po.vat)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {po.items.map((i, idx) => (<span key={idx} className="rounded-full bg-muted px-2 py-0.5">{i.qty} {i.unit} · {i.item}</span>))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{po.terms}</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDoc({ kind: "po", po })} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"><Printer className="h-3.5 w-3.5" /> Print PO</button>
                      {can(role, "awardPO") && po.status !== "Fulfilled" ? (
                        <button onClick={() => advance(po)} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700">Advance status <ArrowRight className="h-3.5 w-3.5" weight="bold" /></button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* Raise PR modal */}
      {prOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setPrOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ClipboardText className="h-5 w-5 text-amber-500" weight="duotone" /> Raise Purchase Request</h3>
              <button onClick={() => setPrOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="col-span-full text-xs font-medium text-muted-foreground">Request title<input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Reinforcement steel for Level 6 core" /></label>
              <label className="text-xs font-medium text-muted-foreground">Project<select className={input} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Category<select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Required date<input type="date" className={input} value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Priority<select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["Low", "Medium", "High", "Urgent"].map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
              <label className="col-span-full text-xs font-medium text-muted-foreground">Justification<textarea rows={2} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} placeholder="Site schedule reference and need rationale" /></label>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Material lines</p>
              <div className="space-y-2">
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_70px_90px] gap-2">
                    <input className="h-9 rounded-lg border border-input bg-card px-2 text-sm outline-none focus:border-amber-500" placeholder="Description" value={it.description} onChange={(e) => { const items = [...form.items]; items[idx] = { ...it, description: e.target.value }; setForm({ ...form, items }); }} />
                    <input className="h-9 rounded-lg border border-input bg-card px-2 text-sm outline-none focus:border-amber-500" placeholder="Unit" value={it.unit} onChange={(e) => { const items = [...form.items]; items[idx] = { ...it, unit: e.target.value }; setForm({ ...form, items }); }} />
                    <input type="number" className="h-9 rounded-lg border border-input bg-card px-2 text-sm outline-none focus:border-amber-500" placeholder="Qty" value={it.qty} onChange={(e) => { const items = [...form.items]; items[idx] = { ...it, qty: e.target.value }; setForm({ ...form, items }); }} />
                    <input type="number" className="h-9 rounded-lg border border-input bg-card px-2 text-sm outline-none focus:border-amber-500" placeholder="Est. rate" value={it.estPrice} onChange={(e) => { const items = [...form.items]; items[idx] = { ...it, estPrice: e.target.value }; setForm({ ...form, items }); }} />
                  </div>
                ))}
              </div>
              <button onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:underline"><Plus className="h-3.5 w-3.5" weight="bold" /> Add line</button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPrOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={createPR} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Submit request</button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Generate PO modal */}
      {poOpen && activePR ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setPoOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Truck className="h-5 w-5 text-amber-500" weight="duotone" /> Generate Purchase Order</h3>
              <button onClick={() => setPoOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Against {activePR.code} · {activePR.title}</p>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-muted-foreground">Supplier<select className={input} value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.rating.toFixed(1)}★</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Delivery date<input type="date" className={input} value={poForm.deliveryDate} onChange={(e) => setPoForm({ ...poForm, deliveryDate: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Terms<textarea rows={2} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-amber-500" value={poForm.terms} onChange={(e) => setPoForm({ ...poForm, terms: e.target.value })} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPoOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={generatePO} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Issue PO</button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Printable documents */}
      {doc?.kind === "pr" ? (
        <DocShell title="Purchase Request" meta={doc.pr.code} onClose={() => setDoc(null)}>
          <CompanyBlock />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">PURCHASE REQUEST</h3>
              <p className="text-xs text-slate-600">Ref {doc.pr.code} · {doc.pr.status} · {doc.pr.createdAt}</p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Project: <span className="font-semibold text-slate-900">{projectName(doc.pr.projectId)}</span></p>
              <p>Required: {doc.pr.requiredDate}</p>
              <p>Priority: {doc.pr.priority}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-700">
            <p>Requested by: <span className="font-semibold text-slate-900">{doc.pr.requestedBy}</span></p>
            <p>Category: <span className="font-semibold text-slate-900">{doc.pr.category}</span></p>
          </div>
          <table className="mt-4 w-full border-collapse text-left text-xs">
            <thead><tr className="border-y border-slate-300 bg-slate-100 text-slate-700"><th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">Description</th><th className="px-2 py-1.5 text-right">Qty</th><th className="px-2 py-1.5">Unit</th><th className="px-2 py-1.5 text-right">Est. Rate (ETB)</th><th className="px-2 py-1.5 text-right">Amount (ETB)</th></tr></thead>
            <tbody>
              {doc.pr.items.map((it, i) => (<tr key={i} className="border-b border-slate-200"><td className="px-2 py-1.5">{i + 1}</td><td className="px-2 py-1.5">{it.description}</td><td className="px-2 py-1.5 text-right font-mono">{it.qty}</td><td className="px-2 py-1.5">{it.unit}</td><td className="px-2 py-1.5 text-right font-mono">{it.estPrice.toLocaleString("en-US")}</td><td className="px-2 py-1.5 text-right font-mono">{(it.qty * it.estPrice).toLocaleString("en-US")}</td></tr>))}
            </tbody>
          </table>
          <p className="mt-3 text-right text-sm font-bold text-slate-900">Estimated Total: ETB {prTotal(doc.pr).toLocaleString("en-US")}</p>
          <p className="mt-3 text-xs text-slate-700">{doc.pr.justification}</p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[11px] text-slate-600">
            {["Requested By", "Project Manager", "Finance Approval"].map((r) => (<div key={r}><div className="mb-1 border-t border-slate-400 pt-1">{r}</div><p className="text-[10px] text-slate-400">Name / Signature / Date</p></div>))}
          </div>
        </DocShell>
      ) : null}

      {doc?.kind === "po" ? (
        <DocShell title="Purchase Order" meta={doc.po.code} onClose={() => setDoc(null)}>
          <CompanyBlock />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">PURCHASE ORDER</h3>
              <p className="text-xs text-slate-600">Ref {doc.po.code} · {doc.po.status} · Issued {doc.po.issueDate}</p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Vendor: {supplierName(doc.po.supplierId)}</p>
              <p>TIN {supplier(doc.po.supplierId)?.tin}</p>
              <p>Delivery by {doc.po.deliveryDate}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-700">Deliver to: {projectName(doc.po.projectId)} · Project Site Store</p>
          <table className="mt-4 w-full border-collapse text-left text-xs">
            <thead><tr className="border-y border-slate-300 bg-slate-100 text-slate-700"><th className="px-2 py-1.5">Item</th><th className="px-2 py-1.5">Unit</th><th className="px-2 py-1.5 text-right">Qty</th><th className="px-2 py-1.5 text-right">Unit Price</th><th className="px-2 py-1.5 text-right">Amount (ETB)</th></tr></thead>
            <tbody>
              {doc.po.items.map((it, i) => (<tr key={i} className="border-b border-slate-200"><td className="px-2 py-1.5">{it.item}</td><td className="px-2 py-1.5">{it.unit}</td><td className="px-2 py-1.5 text-right font-mono">{it.qty}</td><td className="px-2 py-1.5 text-right font-mono">{it.unitPrice.toLocaleString("en-US")}</td><td className="px-2 py-1.5 text-right font-mono">{(it.qty * it.unitPrice).toLocaleString("en-US")}</td></tr>))}
            </tbody>
          </table>
          <div className="mt-3 ml-auto w-56 space-y-1 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{doc.po.subtotal.toLocaleString("en-US")}</span></div>
            <div className="flex justify-between"><span>VAT (15%)</span><span className="font-mono">{doc.po.vat.toLocaleString("en-US")}</span></div>
            <div className="flex justify-between border-t border-slate-400 pt-1 text-sm font-bold"><span>Total ETB</span><span className="font-mono">{doc.po.total.toLocaleString("en-US")}</span></div>
          </div>
          <p className="mt-3 text-xs text-slate-700">{doc.po.terms}</p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[11px] text-slate-600">
            {["Procurement", "Finance", "Authorised Signatory"].map((r) => (<div key={r}><div className="mb-1 border-t border-slate-400 pt-1">{r}</div><p className="text-[10px] text-slate-400">Name / Signature / Date</p></div>))}
          </div>
        </DocShell>
      ) : null}
    </div>
  );
}