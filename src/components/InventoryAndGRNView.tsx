import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowsLeftRight,
  Check,
  ClipboardText,
  Package,
  Plus,
  Printer,
  Truck,
  Warehouse,
  X,
} from "@phosphor-icons/react";
import type {
  GRN,
  GRNItem,
  InventoryItem,
  Project,
  PurchaseOrder,
  Role,
  Site,
  StockMovement,
  Supplier,
} from "@/types";
import {
  Chip,
  DocShell,
  SectionHeader,
  Stat,
  can,
  fmtETB,
  fmtShort,
  todayISO,
} from "@/components/NavbarAndRoleHeader";

export interface ReceiptLine {
  name: string;
  unit: string;
  qty: number;
  siteId: string;
  category: string;
  unitCost: number;
}

interface Props {
  role: Role;
  inventory: InventoryItem[];
  grns: GRN[];
  movements: StockMovement[];
  pos: PurchaseOrder[];
  suppliers: Supplier[];
  projects: Project[];
  sites: Site[];
  projectFilter: string;
  actor: string;
  onCreateGRN: (grn: GRN) => void;
  onReceiveStock: (lines: ReceiptLine[]) => void;
  onIssueStock: (itemId: string, qty: number, note: string, siteId: string) => void;
  onTransferStock: (itemId: string, qty: number, fromSite: string, toSite: string) => void;
}

type Tab = "grn" | "stock" | "ledger";
type Doc = { kind: "grn"; grn: GRN } | null;

const statusOf = (items: GRNItem[]): GRN["status"] => {
  const accepted = items.reduce((s, i) => s + i.acceptedQty, 0);
  const rejected = items.reduce((s, i) => s + i.rejectedQty, 0);
  if (accepted === 0 && rejected > 0) return "Rejected";
  if (rejected > 0) return "Partial";
  return "Accepted";
};

export default function InventoryAndGRNView({
  role, inventory, grns, movements, pos, suppliers, projects, sites, projectFilter, actor,
  onCreateGRN, onReceiveStock, onIssueStock, onTransferStock,
}: Props) {
  const [tab, setTab] = useState<Tab>("grn");
  const [doc, setDoc] = useState<Doc>(null);
  const [grnOpen, setGrnOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [xferOpen, setXferOpen] = useState(false);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [grnForm, setGrnForm] = useState({ poId: pos[0]?.id ?? "", siteId: sites[0]?.id ?? "", items: [] as GRNItem[], remark: "" });
  const [issueForm, setIssueForm] = useState({ itemId: inventory[0]?.id ?? "", qty: "1", note: "" });
  const [xferForm, setXferForm] = useState({ itemId: inventory[0]?.id ?? "", qty: "1", toSite: sites[1]?.id ?? sites[0]?.id ?? "" });

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id;
  const poCode = (id: string) => pos.find((p) => p.id === id)?.code ?? "—";
  const itemName = (id: string) => inventory.find((i) => i.id === id)?.name ?? "Material";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "Vendor";
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Project";

  const visibleStock = useMemo(
    () => (siteFilter === "all" ? inventory : inventory.filter((i) => i.siteId === siteFilter)),
    [inventory, siteFilter],
  );
  const lowStock = useMemo(() => inventory.filter((i) => i.quantity <= i.reorderLevel), [inventory]);
  const stockValue = useMemo(() => inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0), [inventory]);

  const openGRN = () => {
    const po = pos.find((p) => p.id === grnForm.poId) ?? pos[0];
    if (!po) { toast.error("No purchase order available to receive"); return; }
    const items: GRNItem[] = po.items.map((it) => ({ description: it.item, orderedQty: it.qty, acceptedQty: it.qty, rejectedQty: 0, remark: "" }));
    setGrnForm({ ...grnForm, poId: po.id, items, remark: "" });
    setGrnOpen(true);
  };

  const submitGRN = () => {
    const po = pos.find((p) => p.id === grnForm.poId);
    if (!po || grnForm.items.length === 0) { toast.error("Select a purchase order to receive against"); return; }
    const status = statusOf(grnForm.items);
    const seq = grns.length + 1;
    const grn: GRN = {
      id: `grn-${Date.now()}`, code: `GRN-${String(seq).padStart(2, "0")}`, poId: po.id,
      date: todayISO(), receivedBy: actor, inspectedBy: `${role}`, items: grnForm.items,
      status, siteId: grnForm.siteId, remark: grnForm.remark.trim() || "Inspected and recorded at site store.",
    };
    const supp = suppliers.find((s) => s.id === po.supplierId);
    const lines: ReceiptLine[] = grnForm.items
      .filter((i) => i.acceptedQty > 0)
      .map((i) => {
        const poLine = po.items.find((pl) => pl.item === i.description);
        return { name: i.description, unit: poLine?.unit ?? "unit", qty: i.acceptedQty, siteId: grnForm.siteId, category: supp?.category ?? "General", unitCost: poLine?.unitPrice ?? 0 };
      });
    onCreateGRN(grn);
    if (lines.length) onReceiveStock(lines);
    toast.success(`${grn.code} recorded · ${status}`);
    setGrnOpen(false);
  };

  const submitIssue = () => {
    const it = inventory.find((i) => i.id === issueForm.itemId);
    const qty = Number(issueForm.qty);
    if (!it || !qty || qty <= 0) { toast.error("Choose a material and a valid issue quantity"); return; }
    if (qty > it.quantity) { toast.error(`Only ${it.quantity} ${it.unit} available at ${siteName(it.siteId)}`); return; }
    onIssueStock(it.id, qty, issueForm.note.trim() || "Issued to works", it.siteId);
    toast.success(`Issued ${qty} ${it.unit} of ${it.name}`);
    setIssueForm({ ...issueForm, qty: "1", note: "" });
    setIssueOpen(false);
  };

  const submitTransfer = () => {
    const it = inventory.find((i) => i.id === xferForm.itemId);
    const qty = Number(xferForm.qty);
    if (!it || !qty || qty <= 0) { toast.error("Choose a material and a valid transfer quantity"); return; }
    if (qty > it.quantity) { toast.error(`Only ${it.quantity} ${it.unit} available to transfer`); return; }
    if (xferForm.toSite === it.siteId) { toast.error("Destination must differ from the source store"); return; }
    onTransferStock(it.id, qty, it.siteId, xferForm.toSite);
    toast.success(`Transferred ${qty} ${it.unit} to ${siteName(xferForm.toSite)}`);
    setXferOpen(false);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "grn", label: "Goods Receipt (GRN)" },
    { key: "stock", label: "Stock Control" },
    { key: "ledger", label: "Movement Ledger" },
  ];
  const input = "h-9 w-full rounded-lg border border-input bg-card px-2 text-sm outline-none transition focus:border-amber-500";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Stock Value" value={fmtShort(stockValue)} sub={fmtETB(stockValue)} icon={<Warehouse className="h-4 w-4" weight="duotone" />} tone="sky" />
        <Stat label="Materials Tracked" value={`${inventory.length}`} sub={`${sites.length} stores & sites`} icon={<Package className="h-4 w-4" weight="duotone" />} tone="violet" />
        <Stat label="Low-Stock Lines" value={`${lowStock.length}`} sub={lowStock.length ? "Reorder required" : "All above reorder level"} icon={<Package className="h-4 w-4" weight="duotone" />} tone={lowStock.length ? "rose" : "emerald"} />
        <Stat label="GRNs Recorded" value={`${grns.length}`} sub={`${movements.length} stock movements`} icon={<ClipboardText className="h-4 w-4" weight="duotone" />} tone="amber" />
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/70 bg-card p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === t.key ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === t.key ? <motion.span layoutId="inv-tab" className="absolute inset-0 rounded-lg bg-amber-500/15 ring-1 ring-inset ring-amber-500/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} /> : null}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "grn" ? (
        <>
          <SectionHeader title="Goods Received Notes" subtitle="Inspect deliveries against purchase orders and confirm accepted quantities">
            {can(role, "createGRN") ? (
              <button onClick={openGRN} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">
                <Plus className="h-4 w-4" weight="bold" /> Receive Delivery
              </button>
            ) : <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Storekeeper or Site Engineer required</span>}
          </SectionHeader>

          {grns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No deliveries received yet. Create a GRN against an issued purchase order.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {grns.map((g) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{g.code}</span>
                        <Chip label={g.status} />
                        <span className="text-[11px] text-muted-foreground">against {poCode(g.poId)}</span>
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{siteName(g.siteId)}</h3>
                      <p className="text-xs text-muted-foreground">Received {g.date} · {g.receivedBy} · inspected by {g.inspectedBy}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{g.remark}</p>
                    </div>
                    <button onClick={() => setDoc({ kind: "grn", grn: g })} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"><Printer className="h-3.5 w-3.5" /> Print GRN</button>
                  </div>
                  <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full min-w-[520px] text-left text-xs">
                      <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-1.5 font-semibold">Material</th><th className="px-3 py-1.5 text-right font-semibold">Ordered</th><th className="px-3 py-1.5 text-right font-semibold">Accepted</th><th className="px-3 py-1.5 text-right font-semibold">Rejected</th><th className="px-3 py-1.5 font-semibold">Remark</th></tr></thead>
                      <tbody className="divide-y divide-border/60">
                        {g.items.map((it, i) => (
                          <tr key={i}><td className="px-3 py-1.5 text-foreground">{it.description}</td><td className="px-3 py-1.5 text-right font-mono tabular-nums">{it.orderedQty}</td><td className="px-3 py-1.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{it.acceptedQty}</td><td className="px-3 py-1.5 text-right font-mono tabular-nums text-rose-500">{it.rejectedQty}</td><td className="px-3 py-1.5 text-muted-foreground">{it.remark || "—"}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {tab === "stock" ? (
        <>
          <SectionHeader title="Stock Control" subtitle="Live balances per store with reorder alerts, issue, and inter-site transfer">
            <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-card px-2 text-xs font-medium outline-none focus:border-amber-500">
              <option value="all">All stores</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {can(role, "manageStock") ? (
              <>
                <button onClick={() => setIssueOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"><Package className="h-4 w-4" weight="bold" /> Issue Material</button>
                <button onClick={() => setXferOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"><ArrowsLeftRight className="h-4 w-4" weight="bold" /> Transfer</button>
              </>
            ) : null}
          </SectionHeader>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Code</th>
                    <th className="px-4 py-2 font-semibold">Material</th>
                    <th className="px-4 py-2 font-semibold">Store / Location</th>
                    <th className="px-4 py-2 text-right font-semibold">On Hand</th>
                    <th className="px-4 py-2 text-right font-semibold">Reorder</th>
                    <th className="px-4 py-2 text-right font-semibold">Unit Cost</th>
                    <th className="px-4 py-2 text-right font-semibold">Value</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {visibleStock.map((i) => {
                    const low = i.quantity <= i.reorderLevel;
                    return (
                      <tr key={i.id} className={`transition hover:bg-muted/40 ${low ? "bg-rose-500/5" : ""}`}>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{i.code}</td>
                        <td className="px-4 py-2"><span className="font-medium text-foreground">{i.name}</span><span className="block text-[11px] text-muted-foreground">{i.category}</span></td>
                        <td className="px-4 py-2"><span className="text-foreground">{siteName(i.siteId)}</span><span className="block text-[11px] text-muted-foreground">{i.location}</span></td>
                        <td className="px-4 py-2 text-right font-mono font-semibold tabular-nums">{i.quantity} <span className="text-[11px] font-normal text-muted-foreground">{i.unit}</span></td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">{i.reorderLevel}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{fmtETB(i.unitCost)}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{fmtETB(i.quantity * i.unitCost)}</td>
                        <td className="px-4 py-2"><Chip label={low ? "Reorder" : "In Stock"} tone={low ? "rose" : "emerald"} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {tab === "ledger" ? (
        <>
          <SectionHeader title="Movement Ledger" subtitle="Chronological audit trail of receipts, issuances, and transfers" />
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2 font-semibold">Date</th><th className="px-4 py-2 font-semibold">Type</th><th className="px-4 py-2 font-semibold">Material</th><th className="px-4 py-2 text-right font-semibold">Qty</th><th className="px-4 py-2 font-semibold">Route</th><th className="px-4 py-2 font-semibold">Reference</th><th className="px-4 py-2 font-semibold">By</th></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {movements.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No stock movements recorded yet.</td></tr>
                  ) : [...movements].reverse().map((m) => (
                    <tr key={m.id} className="transition hover:bg-muted/40">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{m.date}</td>
                      <td className="px-4 py-2"><Chip label={m.type} tone={m.type === "Receipt" ? "emerald" : m.type === "Issuance" ? "amber" : "sky"} /></td>
                      <td className="px-4 py-2 font-medium text-foreground">{itemName(m.itemId)}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">{m.qty}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{siteName(m.fromSite)} → {siteName(m.toSite)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{m.note}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{m.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {grnOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setGrnOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Truck className="h-5 w-5 text-amber-500" weight="duotone" /> Record Goods Receipt</h3>
              <button onClick={() => setGrnOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Purchase order<select className={input} value={grnForm.poId} onChange={(e) => { const po = pos.find((p) => p.id === e.target.value); setGrnForm({ ...grnForm, poId: e.target.value, items: po ? po.items.map((it) => ({ description: it.item, orderedQty: it.qty, acceptedQty: it.qty, rejectedQty: 0, remark: "" })) : [] }); }}>{pos.map((p) => <option key={p.id} value={p.id}>{p.code} · {supplierName(p.supplierId)}</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Receiving store<select className={input} value={grnForm.siteId} onChange={(e) => setGrnForm({ ...grnForm, siteId: e.target.value })}>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inspection lines</p>
              {grnForm.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_76px_76px_1fr] items-center gap-2">
                  <span className="truncate text-xs text-foreground">{it.description}<span className="block text-[10px] text-muted-foreground">ordered {it.orderedQty}</span></span>
                  <input type="number" className={input} value={it.acceptedQty} onChange={(e) => { const items = [...grnForm.items]; items[idx] = { ...it, acceptedQty: Number(e.target.value) }; setGrnForm({ ...grnForm, items }); }} placeholder="Accepted" />
                  <input type="number" className={input} value={it.rejectedQty} onChange={(e) => { const items = [...grnForm.items]; items[idx] = { ...it, rejectedQty: Number(e.target.value) }; setGrnForm({ ...grnForm, items }); }} placeholder="Rejected" />
                  <input className={input} value={it.remark} onChange={(e) => { const items = [...grnForm.items]; items[idx] = { ...it, remark: e.target.value }; setGrnForm({ ...grnForm, items }); }} placeholder="Inspection remark" />
                </div>
              ))}
            </div>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">Overall remark<textarea rows={2} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-amber-500" value={grnForm.remark} onChange={(e) => setGrnForm({ ...grnForm, remark: e.target.value })} placeholder="Condition on arrival, documentation received..." /></label>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setGrnOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={submitGRN} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Confirm receipt</button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {issueOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setIssueOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Package className="h-5 w-5 text-amber-500" weight="duotone" /> Issue Material</h3>
              <button onClick={() => setIssueOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">Material<select className={input} value={issueForm.itemId} onChange={(e) => setIssueForm({ ...issueForm, itemId: e.target.value })}>{inventory.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.quantity} {i.unit} @ {siteName(i.siteId)}</option>)}</select></label>
              <label className="block text-xs font-medium text-muted-foreground">Issue quantity<input type="number" className={input} value={issueForm.qty} onChange={(e) => setIssueForm({ ...issueForm, qty: e.target.value })} /></label>
              <label className="block text-xs font-medium text-muted-foreground">Works reference<input className={input} value={issueForm.note} onChange={(e) => setIssueForm({ ...issueForm, note: e.target.value })} placeholder="e.g. Level 6 core column fixing" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setIssueOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={submitIssue} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Issue <Check className="ml-1 inline h-4 w-4" weight="bold" /></button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {xferOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setXferOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ArrowsLeftRight className="h-5 w-5 text-amber-500" weight="duotone" /> Inter-Site Transfer</h3>
              <button onClick={() => setXferOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">Material<select className={input} value={xferForm.itemId} onChange={(e) => setXferForm({ ...xferForm, itemId: e.target.value })}>{inventory.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.quantity} {i.unit} @ {siteName(i.siteId)}</option>)}</select></label>
              <label className="block text-xs font-medium text-muted-foreground">Transfer quantity<input type="number" className={input} value={xferForm.qty} onChange={(e) => setXferForm({ ...xferForm, qty: e.target.value })} /></label>
              <label className="block text-xs font-medium text-muted-foreground">Destination store<select className={input} value={xferForm.toSite} onChange={(e) => setXferForm({ ...xferForm, toSite: e.target.value })}>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setXferOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={submitTransfer} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Transfer</button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {doc?.kind === "grn" ? (
        <DocShell title="Goods Received Note" meta={doc.grn.code} onClose={() => setDoc(null)}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-slate-900 pb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">GOODS RECEIVED NOTE</h3>
              <p className="text-xs text-slate-600">Ref {doc.grn.code} · {doc.grn.date} · against {poCode(doc.grn.poId)}</p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold text-slate-900">{siteName(doc.grn.siteId)}</p>
              <p>Received by {doc.grn.receivedBy}</p>
              <p>Inspected by {doc.grn.inspectedBy}</p>
            </div>
          </div>
          <table className="mt-4 w-full border-collapse text-left text-xs">
            <thead><tr className="border-y border-slate-300 bg-slate-100 text-slate-700"><th className="px-2 py-1.5">Material</th><th className="px-2 py-1.5 text-right">Ordered</th><th className="px-2 py-1.5 text-right">Accepted</th><th className="px-2 py-1.5 text-right">Rejected</th><th className="px-2 py-1.5">Remark</th></tr></thead>
            <tbody>{doc.grn.items.map((it, i) => (<tr key={i} className="border-b border-slate-200"><td className="px-2 py-1.5">{it.description}</td><td className="px-2 py-1.5 text-right font-mono">{it.orderedQty}</td><td className="px-2 py-1.5 text-right font-mono">{it.acceptedQty}</td><td className="px-2 py-1.5 text-right font-mono">{it.rejectedQty}</td><td className="px-2 py-1.5">{it.remark || "—"}</td></tr>))}</tbody>
          </table>
          <p className="mt-3 text-xs text-slate-700">{doc.grn.remark}</p>
          <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[11px] text-slate-600">
            {["Received By", "Office Engineer", "Construction Manager"].map((r) => (<div key={r}><div className="mb-1 border-t border-slate-400 pt-1">{r}</div><p className="text-[10px] text-slate-400">Name / Signature / Date</p></div>))}
          </div>
        </DocShell>
      ) : null}
    </div>
  );
}