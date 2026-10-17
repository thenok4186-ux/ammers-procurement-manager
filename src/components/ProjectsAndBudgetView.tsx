import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Buildings,
  ChartBar,
  CurrencyDollar,
  Plus,
  Receipt,
  TrendUp,
  X,
} from "@phosphor-icons/react";
import type { ExpenseRecord, Project, PurchaseOrder, Role } from "@/types";
import { Chip, ProgressBar, SectionHeader, Stat, can, fmtETB, fmtShort, todayISO } from "@/components/NavbarAndRoleHeader";

interface Props {
  role: Role;
  projects: Project[];
  expenses: ExpenseRecord[];
  pos: PurchaseOrder[];
  projectFilter: string;
  onCreate: (p: Project) => void;
}

const health = (p: Project) => {
  const spent = p.poCommitments + p.actualExpenses;
  const ratio = p.allocatedBudget ? spent / p.allocatedBudget : 0;
  if (spent > p.allocatedBudget) return { label: "Over Budget", tone: "rose" as const };
  if (ratio > 0.85) return { label: "At Risk", tone: "amber" as const };
  return { label: "Healthy", tone: "emerald" as const };
};

const emptyForm = {
  code: "", name: "", client: "", location: "", manager: "",
  allocatedBudget: "", startDate: todayISO(), endDate: "", progress: "0",
};

export default function ProjectsAndBudgetView({ role, projects, expenses, pos, projectFilter, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const visible = useMemo(
    () => (projectFilter === "all" ? projects : projects.filter((p) => p.id === projectFilter)),
    [projects, projectFilter],
  );

  const totals = useMemo(() => {
    const allocated = visible.reduce((s, p) => s + p.allocatedBudget, 0);
    const committed = visible.reduce((s, p) => s + p.poCommitments, 0);
    const actual = visible.reduce((s, p) => s + p.actualExpenses, 0);
    return { allocated, committed, actual, remaining: allocated - committed - actual };
  }, [visible]);

  const submit = () => {
    if (!form.name.trim() || !form.code.trim() || !form.allocatedBudget) {
      toast.error("Project name, code and allocated budget are required");
      return;
    }
    const project: Project = {
      id: `prj-${Date.now()}`,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      client: form.client.trim() || "Internal",
      location: form.location.trim() || "Addis Ababa",
      status: "Planning",
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      allocatedBudget: Number(form.allocatedBudget) || 0,
      poCommitments: 0,
      actualExpenses: 0,
      progress: Number(form.progress) || 0,
      manager: form.manager.trim() || role,
    };
    onCreate(project);
    toast.success(`${project.code} · ${project.name} registered`);
    setForm(emptyForm);
    setOpen(false);
  };

  const input = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Allocated Budget" value={fmtShort(totals.allocated)} sub={fmtETB(totals.allocated)} icon={<CurrencyDollar className="h-4 w-4" weight="duotone" />} tone="sky" />
        <Stat label="PO Commitments" value={fmtShort(totals.committed)} sub={fmtETB(totals.committed)} icon={<Receipt className="h-4 w-4" weight="duotone" />} tone="amber" />
        <Stat label="Actual Expenses" value={fmtShort(totals.actual)} sub={fmtETB(totals.actual)} icon={<TrendUp className="h-4 w-4" weight="duotone" />} tone="violet" />
        <Stat label="Available Funds" value={fmtShort(totals.remaining)} sub={totals.remaining < 0 ? "Oversubscribed" : fmtETB(totals.remaining)} icon={<ChartBar className="h-4 w-4" weight="duotone" />} tone={totals.remaining < 0 ? "rose" : "emerald"} />
      </div>

      <SectionHeader title="Project Portfolio" subtitle="Budget allocation, commitments, and incurred cost per site">
        {can(role, "createProject") ? (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98]">
            <Plus className="h-4 w-4" weight="bold" /> New Project
          </button>
        ) : (
          <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">View-only for {role}</span>
        )}
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visible.map((p) => {
          const spent = p.poCommitments + p.actualExpenses;
          const committedPct = p.allocatedBudget ? (p.poCommitments / p.allocatedBudget) * 100 : 0;
          const spendPct = p.allocatedBudget ? (p.actualExpenses / p.allocatedBudget) * 100 : 0;
          const h = health(p);
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{p.code}</span>
                    <Chip label={p.status} />
                  </div>
                  <h3 className="mt-1 truncate text-base font-semibold text-foreground">{p.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{p.client} · {p.location}</p>
                </div>
                <Chip label={h.label} tone={h.tone} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><dt className="text-muted-foreground">Allocated</dt><dd className="font-mono font-semibold text-foreground">{fmtETB(p.allocatedBudget)}</dd></div>
                <div><dt className="text-muted-foreground">Committed POs</dt><dd className="font-mono font-semibold text-foreground">{fmtETB(p.poCommitments)}</dd></div>
                <div><dt className="text-muted-foreground">Actual Spend</dt><dd className="font-mono font-semibold text-foreground">{fmtETB(p.actualExpenses)}</dd></div>
                <div><dt className="text-muted-foreground">Available</dt><dd className={`font-mono font-semibold ${p.allocatedBudget - spent < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtETB(p.allocatedBudget - spent)}</dd></div>
              </dl>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>PO commitment</span><span className="font-mono">{committedPct.toFixed(0)}%</span></div>
                  <ProgressBar value={committedPct} tone="amber" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Actual expenditure</span><span className="font-mono">{spendPct.toFixed(0)}%</span></div>
                  <ProgressBar value={spendPct} tone={spendPct > 85 ? "rose" : "emerald"} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Physical progress</span><span className="font-mono">{p.progress}%</span></div>
                  <ProgressBar value={p.progress} tone="sky" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Manager: <span className="font-medium text-foreground">{p.manager}</span> · {p.startDate} to {p.endDate}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Budget Variance Analyzer</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">Project</th>
                <th className="px-4 py-2 text-right font-semibold">Allocated</th>
                <th className="px-4 py-2 text-right font-semibold">Committed</th>
                <th className="px-4 py-2 text-right font-semibold">Actual</th>
                <th className="px-4 py-2 text-right font-semibold">Variance</th>
                <th className="px-4 py-2 font-semibold">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visible.map((p) => {
                const spent = p.poCommitments + p.actualExpenses;
                const h = health(p);
                return (
                  <tr key={p.id} className="transition hover:bg-muted/40">
                    <td className="px-4 py-2.5 font-medium text-foreground">{p.code} <span className="text-muted-foreground">{p.name}</span></td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{fmtETB(p.allocatedBudget)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{fmtETB(p.poCommitments)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{fmtETB(p.actualExpenses)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${p.allocatedBudget - spent < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtETB(p.allocatedBudget - spent)}</td>
                    <td className="px-4 py-2.5"><Chip label={h.label} tone={h.tone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Cost-centre ledger entries: {expenses.length} recorded · {pos.length} purchase orders · {visible.length} project(s) in view.
      </p>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={() => setOpen(false)}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Buildings className="h-5 w-5 text-amber-500" weight="duotone" /> Register Project</h3>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Project code<input className={input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="P-106" /></label>
              <label className="text-xs font-medium text-muted-foreground">Project manager<input className={input} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="Full name" /></label>
              <label className="col-span-full text-xs font-medium text-muted-foreground">Project name<input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mekelle Logistics Hub" /></label>
              <label className="text-xs font-medium text-muted-foreground">Client<input className={input} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Client / employer" /></label>
              <label className="text-xs font-medium text-muted-foreground">Location<input className={input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, region" /></label>
              <label className="text-xs font-medium text-muted-foreground">Allocated budget (ETB)<input type="number" className={input} value={form.allocatedBudget} onChange={(e) => setForm({ ...form, allocatedBudget: e.target.value })} placeholder="150000000" /></label>
              <label className="text-xs font-medium text-muted-foreground">Kickoff progress (%)<input type="number" className={input} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} placeholder="0" /></label>
              <label className="text-xs font-medium text-muted-foreground">Start date<input type="date" className={input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
              <label className="text-xs font-medium text-muted-foreground">Target completion<input type="date" className={input} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted">Cancel</button>
              <button onClick={submit} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">Register project</button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}