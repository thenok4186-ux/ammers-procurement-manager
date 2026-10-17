import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChartBar,
  CurrencyDollar,
  FileText,
  Plus,
  Printer,
  Receipt,
  SealCheck,
  TrendUp,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import type { ExpenseRecord, InventoryItem, LaborLog, Project, PurchaseOrder, Role, Supplier } from "@/types";
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
import { EXPENSE_CATEGORIES, TRADES } from "@/data/initialData";

interface Props {
  role: Role;
  actor: string;
  labor: LaborLog[];
  expenses: ExpenseRecord[];
  projects: Project[];
  pos: PurchaseOrder[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  projectFilter: string;
  initialTab?: "labor" | "expenses" | "reports";
  onAddLabor: (log: LaborLog) => void;
  onAddExpense: (exp: ExpenseRecord) => void;
}

type Tab = "labor" | "expenses" | "reports";

const laborCost = (l: LaborLog) => l.dayRate * l.days + Math.round((l.dayRate / 8) * 1.5 * l.overtime);

export default function LaborExpensesAndReportsView({
  role, actor, labor, expenses, projects, pos, suppliers, inventory, projectFilter, initialTab,
  onAddLabor, onAddExpense,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "labor");
  const [laborOpen, setLaborOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [laborForm, setLaborForm] = useState({
    workerName: "", trade: TRADES[0] as string, roleTitle: "Skilled Worker",
    projectId: projects[0]?.id ?? "", date: todayISO(), dayRate: "850", days: "1", overtime: "0",
  });
  const [expForm, setExpForm] = useState({
    projectId: projects[0]?.id ?? "", category: EXPENSE_CATEGORIES[0] as string,
    description: "", amount: "", voucher: `VCH-${2300 + expenses.length + 1}`, date: todayISO(),
  });

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Unassigned";
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "Vendor";

  const scopedLabor = useMemo(() => (projectFilter === "all" ? labor : labor.filter((l) => l.projectId === projectFilter)), [labor, projectFilter]);
  const scopedExp = useMemo(() => (projectFilter === "all" ? expenses : expenses.filter((e) => e.projectId === projectFilter)), [expenses, projectFilter]);

  const laborTotal = scopedLabor.reduce((s, l) => s + laborCost(l), 0);
  const expTotal = scopedExp.reduce((s, e) => s + e.amount, 0);

  const byTrade = useMemo(() => {
    const map = new Map<string, number>();
    scopedLabor.forEach((l) => map.set(l.trade, (map.get(l.trade) ?? 0) + laborCost(l)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [scopedLabor]);

  const bySupplier = useMemo(() => {
    const map = new Map<string, number>();
    pos.forEach((p) => map.set(p.supplierId, (map.get(p.supplierId) ?? 0) + p.total));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [pos]);

  const budgetRows = useMemo(
    () => projects.map((p) => {
      const spent = p.poCommitments + p.actualExpenses;
      return { p, spent, variance: p.allocatedBudget - spent, burn: p.allocatedBudget ? Math.round((spent / p.allocatedBudget) * 100) : 0 };
    }),
    [projects],
  );

  const submitLabor = () => {
    if (!laborForm.workerName.trim() || !Number(laborForm.dayRate)) { toast.error("Worker name and daily rate are required"); return; }
    const log: LaborLog = {
      id: `lb-${Date.now()}`, date: laborForm.date, projectId: laborForm.projectId,
      workerName: laborForm.workerName.trim(), trade: laborForm.trade, role: laborForm.roleTitle,
      dayRate: Number(laborForm.dayRate), days: Number(laborForm.days) || 1, overtime: Number(laborForm.overtime) || 0,
    };
    onAddLabor(log);
    toast.success(`Labour logged for ${log.workerName}`);
    setLaborForm({ ...laborForm, workerName: "", overtime: "0" });
    setLaborOpen(false);
  };

  const submitExpense = () => {
    if (!expForm.description.trim() || !Number(expForm.amount)) { toast.error("Description and amount are required"); return; }
    const exp: ExpenseRecord = {
      id: `ex-${Date.now()}`, date: expForm.date, projectId: expForm.projectId,
      category: expForm.category, description: expForm.description.trim(),
      amount: Number(expForm.amount), voucher: expForm.voucher, recordedBy: actor,
    };
    onAddExpense(exp);
    toast.success(`Expense ${exp.voucher} recorded`);
    setExpForm({ ...expForm, description: "", amount: "", voucher: `VCH-${2300 + expenses.length + 2}` });
    setExpOpen(false);
  };

  const exportCSV = () => {
    const rows = [["Type", "Reference", "Project", "Detail", "Amount (ETB)"],
      ...budgetRows.map((r) => ["Budget", r.p.code, r.p.name, `Burn ${r.burn}%`, String(r.variance)]),
      ...scopedExp.map((e) => ["Expense", e.voucher, projectName(e.projectId), e.description, String(e.amount)]),
      ...scopedLabor.map((l) => ["Labour", l.id, projectName(l.projectId), `${l.workerName} · ${l.trade}`, String(laborCost(l))])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join(String.fromCharCode(10));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `mers-report-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as CSV");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "labor", label: "Labour Register" },
    { key: "expenses", label: "Expense Ledger" },
    { key: "reports", label: "Analytics & Reports" },
  ];
  const input = "h-9 w-full rounded-lg border border-input bg-card px-2 text-sm outline-none transition focus:border-amber-500";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Labour Cost" value={fmtShort(laborTotal)} sub={`${scopedLabor.length} entries`} icon={<UsersThree className="h-4 w-4" weight="duotone" />} tone="violet" />
        <Stat label="Direct Expenses" value={fmtShort(expTotal)} sub={`${scopedExp.length} vouchers`} icon={<TrendUp className="h-4 w-4" weight="duotone" />} tone="amber" />
        <Stat label="Committed POs" value={fmtShort(pos.reduce((s, p) => s + p.total, 0))} sub={`${pos.length} orders`} icon={<Receipt className="h-4 w-4" weight="duotone" />} tone="sky" />
        <Stat label="Stock Valuation" value={fmtShort(inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0))} sub={`${inventory.length} material lines`} icon={<SealCheck className="h-4 w-4" weight="duotone" />} tone="emerald" />
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/70 bg-card p-1.5 shadow-sm">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === t.key ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === t.key ? <motion.span layoutId="fin-tab" className="absolute inset-0 rounded-lg bg-amber-500/15 ring-1 ring-inset ring-amber-500/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} /> : null}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "labor" ? (
        <>
          <SectionHeader title="Labour Register" subtitle="Daily trade attendance and site payroll accrual">
            {can(role, "logLabor") ? (
              <button onClick={() => setLaborOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"><Plus className="h-4 w-4" weight="bold" /> Log Labour</button>
            ) : <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Site or PM role required</span>}
          </SectionHeader>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2 font-semibold">Date</th><th className="px-4 py-2 font-semibold">Worker</th><th className="px-4 py-2 font-semibold">Trade</th><th className="px-4 py-2 font-semibold">Project</th><th className="px-4 py-2 text-right font-semibold">Day Rate</th><th className="px-4 py-2 text-right font-semibold">Days</th><th className="px-4 py-2 text-right font-semibold">OT hrs</th><th className="px-4 py-2 text-right font-semibold">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scopedLabor.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No labour entries recorded in this view.</td></tr>
                  ) : [...scopedLabor].reverse().map((l) => (
                    <tr key={l.id} className="transition hover:bg-muted/40">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{l.date}</td>
                      <td className="px-4 py-2 font-medium text-foreground">{l.workerName}<span className="block text-[11px] text-muted-foreground">{l.role}</span></td>
                      <td className="px-4 py-2"><Chip label={l.trade} tone="sky" /></td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{projectName(l.projectId)}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">{fmtETB(l.dayRate)}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">{l.days}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">{l.overtime}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold tabular-nums">{fmtETB(laborCost(l))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {tab === "expenses" ? (
        <>
          <SectionHeader title="Site Expense Ledger" subtitle="Direct costs booked against project cost centres">
            {can(role, "logExpense") ? (
              <button onClick={() => setExpOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"><Plus className="h-4 w-4" weight="bold" /> Record Expense</button>
            ) : <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">Finance or site role required</span>}
          </SectionHeader>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2 font-semibold">Voucher</th><th className="px-4 py-2 font-semibold">Date</th><th className="px-4 py-2 font-semibold">Category</th><th className="px-4 py-2 font-semibold">Description</th><th className="px-4 py-2 font-semibold">Project</th><th className="px-4 py-2 text-right font-semibold">Amount</th><th className="px-4 py-2 font-semibold">Recorded By</th></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scopedExp.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No expenses recorded in this view.</td></tr>
                  ) : [...scopedExp].reverse().map((e) => (
                    <tr key={e.id} className="transition hover:bg-muted/40">
                      <td className="px-4 py-2 font-mono text-xs text-amber-600 dark:text-amber-400">{e.voucher}</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{e.date}</td>
                      <td className="px-4 py-2"><Chip label={e.category} tone="violet" /></td>
                      <td className="px-4 py-2 text-foreground">{e.description}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{projectName(e.projectId)}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold tabular-nums">{fmtETB(e.amount)}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{e.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {tab === "reports" ? (
        <>
          <SectionHeader title="Analytics & Reports" subtitle="Budget burn, procurement concentration, and labour distribution">
            <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"><Printer className="h-4 w-4" weight="bold" /> Board Report</button>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"><FileText className="h-4 w-4" weight="bold" /> Export CSV</button>
          </SectionHeader>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><ChartBar className="h-4 w-4 text-amber-500" weight="duotone" /> Budget Burn by Project</h3>
              <div className="space-y-3">
                {budgetRows.map((r) => (
                  <div key={r.p.id}>
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="font-medium text-foreground">{r.p.code} · {r.p.name}</span><span className={`font-mono ${r.variance < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>{r.burn}% burnt</span></div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, r.burn)}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className={`h-full rounded-full ${r.burn > 100 ? "bg-rose-500" : r.burn > 85 ? "bg-amber-500" : "bg-emerald-500"}`} /></div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Variance {fmtETB(r.variance)} of {fmtETB(r.p.allocatedBudget)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><CurrencyDollar className="h-4 w-4 text-amber-500" weight="duotone" /> Procurement Concentration</h3>
                {bySupplier.length === 0 ? <p className="text-xs text-muted-foreground">No purchase orders yet.</p> : (
                  <ul className="space-y-2">
                    {bySupplier.map(([sid, total]) => (
                      <li key={sid} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{supplierName(sid)}</span>
                        <span className="font-mono font-semibold tabular-nums text-muted-foreground">{fmtETB(total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><UsersThree className="h-4 w-4 text-amber-500" weight="duotone" /> Labour Cost by Trade</h3>
                {byTrade.length === 0 ? <p className="text-xs text-muted-foreground">No labour recorded yet.</p> : (
                  <ul className="space-y-2">
                    {byTrade.map(([trade, total]) => (
                      <li key={trade} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{trade}</span>
                        <span className="font-mono font-semibold tabular-nums text-muted-foreground">{fmtETB(total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {laborOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setLaborOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><UsersThree className="h-5 w-5 text-amber-500" weight="duotone" /> Log Labour</h3>
              <button onClick={() => setLaborOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Worker name<input className={input} value={laborForm.workerName} onChange={(e) => setLaborForm({ ...laborForm, workerName: e.target.value })} placeholder="Full name" /></label>
              <label className="text-xs font-medium text-muted-foreground">Trade<select className={input} value={laborForm.trade} onChange={(e) => setLaborForm({ ...laborForm, trade: e.target.value })}>{TRADES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Role / grade<input className={input} value={laborForm.roleTitle} onChange={(e) => setLaborForm({ ...laborForm, roleTitle: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Project<select className={input} value={laborForm.projectId} onChange={(e) => setLaborForm({ ...laborForm, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Date<input type="date" className={input} value={laborForm.date} onChange={(e) => setLaborForm({ ...laborForm, date: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Day rate (ETB)<input type="number" className={input} value={laborForm.dayRate} onChange={(e) => setLaborForm({ ...laborForm, dayRate: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Days worked<input type="number" className={input} value={laborForm.days} onChange={(e) => setLaborForm({ ...laborForm, days: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Overtime hours<input type="number" className={input} value={laborForm.overtime} onChange={(e) => setLaborForm({ ...laborForm, overtime: e.target.value })} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setLaborOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={submitLabor} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Save entry</button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {expOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setExpOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Receipt className="h-5 w-5 text-amber-500" weight="duotone" /> Record Expense</h3>
              <button onClick={() => setExpOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Project<select className={input} value={expForm.projectId} onChange={(e) => setExpForm({ ...expForm, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
              <label className="text-xs font-medium text-muted-foreground">Category<select className={input} value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
              <label className="col-span-full text-xs font-medium text-muted-foreground">Description<input className={input} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="What was purchased or paid for" /></label>
              <label className="text-xs font-medium text-muted-foreground">Amount (ETB)<input type="number" className={input} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Voucher no.<input className={input} value={expForm.voucher} onChange={(e) => setExpForm({ ...expForm, voucher: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Date<input type="date" className={input} value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setExpOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={submitExpense} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Post expense</button>
            </div>
          </motion.div>
        </div>
      ) : null}

      {reportOpen ? (
        <DocShell title="Board Report" meta={`Generated ${todayISO()} · ${role}`} onClose={() => setReportOpen(false)}>
          <div className="border-b-2 border-slate-900 pb-3">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">CONSOLIDATED PORTFOLIO REPORT</h3>
            <p className="text-xs text-slate-600">Budget performance, procurement commitments, and cost accruals</p>
          </div>
          <table className="mt-4 w-full border-collapse text-left text-xs">
            <thead><tr className="border-y border-slate-300 bg-slate-100 text-slate-700"><th className="px-2 py-1.5">Project</th><th className="px-2 py-1.5 text-right">Allocated</th><th className="px-2 py-1.5 text-right">Committed</th><th className="px-2 py-1.5 text-right">Actual</th><th className="px-2 py-1.5 text-right">Variance</th><th className="px-2 py-1.5 text-right">Burn %</th></tr></thead>
            <tbody>{budgetRows.map((r) => (<tr key={r.p.id} className="border-b border-slate-200"><td className="px-2 py-1.5">{r.p.code} · {r.p.name}</td><td className="px-2 py-1.5 text-right font-mono">{r.p.allocatedBudget.toLocaleString("en-US")}</td><td className="px-2 py-1.5 text-right font-mono">{r.p.poCommitments.toLocaleString("en-US")}</td><td className="px-2 py-1.5 text-right font-mono">{r.p.actualExpenses.toLocaleString("en-US")}</td><td className="px-2 py-1.5 text-right font-mono">{r.variance.toLocaleString("en-US")}</td><td className="px-2 py-1.5 text-right font-mono">{r.burn}%</td></tr>))}</tbody>
          </table>
          <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="mb-1 font-semibold text-slate-900">Labour Cost by Trade</p>
              {byTrade.length === 0 ? <p className="text-slate-500">No labour recorded.</p> : byTrade.map(([t, v]) => (<p key={t} className="flex justify-between border-b border-slate-100 py-0.5"><span>{t}</span><span className="font-mono">{v.toLocaleString("en-US")}</span></p>))}
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900">Procurement by Supplier</p>
              {bySupplier.length === 0 ? <p className="text-slate-500">No POs issued.</p> : bySupplier.map(([s, v]) => (<p key={s} className="flex justify-between border-b border-slate-100 py-0.5"><span>{supplierName(s)}</span><span className="font-mono">{v.toLocaleString("en-US")}</span></p>))}
            </div>
          </div>
          <p className="mt-5 text-[11px] text-slate-500">Prepared by {actor} · {ORG_NOTE}</p>
        </DocShell>
      ) : null}
    </div>
  );
}

const ORG_NOTE = "Mers Consulting and Construction PLC · Integrated ERP Portal";