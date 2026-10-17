import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  ArrowRight,
  Buildings,
  ChartBar,
  ClipboardText,
  Package,
  Receipt,
  SealCheck,
  SquaresFour,
  TrendUp,
  UsersThree,
  Warehouse,
} from "@phosphor-icons/react";
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
  Role,
  ViewKey,
} from "@/types";
import type { AppState } from "@/data/initialData";
import {
  ORG,
  SITES,
  loadState,
  saveState,
  resetToSeedState,
  createFreshBlankState,
  clearHistoryOnly,
  clearAuditLogsOnly,
} from "@/data/initialData";
import type { ResetMode } from "@/types";
import AdminSystemControls from "@/components/AdminSystemControls";
import NavbarAndRoleHeader, {
  Chip,
  ProgressBar,
  SectionHeader,
  Stat,
  fmtETB,
  fmtShort,
  navForRole,
  todayISO,
} from "@/components/NavbarAndRoleHeader";
import { LanguageProvider, useTranslation } from "@/i18n";
import ProjectsAndBudgetView from "@/components/ProjectsAndBudgetView";
import ProcurementWorkflowView from "@/components/ProcurementWorkflowView";
import InventoryAndGRNView, { type ReceiptLine } from "@/components/InventoryAndGRNView";
import LaborExpensesAndReportsView from "@/components/LaborExpensesAndReportsView";

const stamp = (): string => new Date().toISOString().slice(0, 16).replace("T", " ");

interface DashProps {
  role: Role;
  state: AppState;
  search: string;
  projectFilter: string;
  setView: (v: ViewKey) => void;
}

function Dashboard({ role, state, search, projectFilter, setView }: DashProps) {
  const { t } = useTranslation();
  const fill = (s: string, m: Record<string, string | number>) =>
    s.replace(/\{(\w+)\}/g, (_, k) => String(m[k] ?? ""));
  const { projects, prs, pos, inventory, grns, labor, expenses, activity } = state;

  const visible = useMemo(() => {
    let list = projectFilter === "all" ? projects : projects.filter((p) => p.id === projectFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.name, p.code, p.client, p.location, p.manager].some((f) => f.toLowerCase().includes(q)) ||
        pos.some((o) => o.projectId === p.id && o.code.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [projects, projectFilter, search, pos]);

  const allocated = projects.reduce((s, p) => s + p.allocatedBudget, 0);
  const committed = projects.reduce((s, p) => s + p.poCommitments, 0);
  const actual = projects.reduce((s, p) => s + p.actualExpenses, 0);
  const stockValue = inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const overBudget = projects.filter((p) => p.poCommitments + p.actualExpenses > p.allocatedBudget);
  const openPRs = prs.filter((p) => p.status === "Pending PM" || p.status === "Pending Finance");
  const pendingPRs = prs.filter((p) => p.status !== "Approved" && p.status !== "Rejected");

  const actionCard: Record<Role, { title: string; body: string; cta: string; view: ViewKey }> = {
    CEO: { title: t("action.CEO.title"), body: fill(t("action.CEO.body"), { a: projects.length, b: openPRs.length }), cta: t("action.CEO.cta"), view: "procurement" },
    "Operations Manager": { title: t("action.Operations Manager.title"), body: fill(t("action.Operations Manager.body"), { a: openPRs.length, b: pos.length }), cta: t("action.Operations Manager.cta"), view: "procurement" },
    "Human Resources": { title: t("action.Human Resources.title"), body: fill(t("action.Human Resources.body"), { a: labor.length }), cta: t("action.Human Resources.cta"), view: "labor" },
    "Construction Manager": { title: t("action.Construction Manager.title"), body: fill(t("action.Construction Manager.body"), { a: pendingPRs.length }), cta: t("action.Construction Manager.cta"), view: "procurement" },
    "Project Manager": { title: t("action.Project Manager.title"), body: fill(t("action.Project Manager.body"), { a: pendingPRs.length }), cta: t("action.Project Manager.cta"), view: "procurement" },
    "Office Engineer": { title: t("action.Office Engineer.title"), body: fill(t("action.Office Engineer.body"), { a: pendingPRs.length }), cta: t("action.Office Engineer.cta"), view: "labor" },
    Finance: { title: t("action.Finance.title"), body: fill(t("action.Finance.body"), { a: fmtShort(committed), b: fmtShort(allocated) }), cta: t("action.Finance.cta"), view: "projects" },
    Procurement: { title: t("action.Procurement.title"), body: fill(t("action.Procurement.body"), { a: openPRs.length, b: pos.length }), cta: t("action.Procurement.cta"), view: "procurement" },
    Architecture: { title: t("action.Architecture.title"), body: fill(t("action.Architecture.body"), { a: projects.length, b: prs.length }), cta: t("action.Architecture.cta"), view: "projects" },
    Reception: { title: t("action.Reception.title"), body: fill(t("action.Reception.body"), { a: projects.length }), cta: t("action.Reception.cta"), view: "dashboard" },
  };
  const action = actionCard[role];

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-lg sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">{t("dash.heroEyebrow")}</p>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight sm:text-3xl">{ORG.name}</h1>
            <p className="mt-2 text-sm text-slate-300">{t(`blurb.${role}`)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/15">
                {t("ui.signedInAs")} <span className="font-semibold text-amber-300">{t(`roles.${role}`)}</span>
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/15">{todayISO()}</span>
            </div>
          </div>
          <button onClick={() => setView(action.view)} className="group relative w-full max-w-xs rounded-xl border border-white/15 bg-white/5 p-4 text-left backdrop-blur transition hover:border-amber-400/40 hover:bg-white/10 sm:w-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{t("ui.actionPanel")}</p>
            <p className="mt-1 text-sm font-semibold text-white">{action.title}</p>
            <p className="mt-1 text-xs text-slate-300">{action.body}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-300">{action.cta}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" weight="bold" /></span>
          </button>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label={t("stat.allocatedBudget")} value={fmtShort(allocated)} sub={fmtETB(allocated)} icon={<Buildings className="h-4 w-4" weight="duotone" />} tone="sky" />
        <Stat label={t("stat.poCommitments")} value={fmtShort(committed)} sub={`${pos.length} ${t("sub.purchaseOrders")}`} icon={<Receipt className="h-4 w-4" weight="duotone" />} tone="amber" />
        <Stat label={t("stat.actualSpend")} value={fmtShort(actual)} sub={`${expenses.length} ${t("sub.expenseVouchers")}`} icon={<TrendUp className="h-4 w-4" weight="duotone" />} tone="violet" />
        <Stat label={t("stat.stockValuation")} value={fmtShort(stockValue)} sub={`${inventory.length} ${t("sub.materialLines")}`} icon={<Warehouse className="h-4 w-4" weight="duotone" />} tone="emerald" />
        <Stat label={t("stat.openRequests")} value={`${openPRs.length}`} sub={`${prs.length} ${t("sub.totalPRsRaised")}`} icon={<ClipboardText className="h-4 w-4" weight="duotone" />} tone="slate" />
        <Stat label={t("stat.stockAlerts")} value={`${lowStock.length}`} sub={overBudget.length ? `${overBudget.length} ${t("sub.projectsOverBudget")}` : t("sub.budgetsWithinLimit")} icon={<Package className="h-4 w-4" weight="duotone" />} tone={lowStock.length ? "rose" : "emerald"} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionHeader title={t("dash.projectBudgetControl")} subtitle={t("dash.budgetControlSub")}>
            <button onClick={() => setView("projects")} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted">{t("dash.openProjectRegister")}<ArrowRight className="h-3.5 w-3.5" weight="bold" /></button>
          </SectionHeader>
          <div className="space-y-3">
            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{t("dash.noProjectsMatch")}</div>
            ) : visible.map((p) => {
              const spent = p.poCommitments + p.actualExpenses;
              const burn = p.allocatedBudget ? Math.round((spent / p.allocatedBudget) * 100) : 0;
              const tone = burn > 100 ? "rose" : burn > 85 ? "amber" : "emerald";
              return (
                <div key={p.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-amber-500/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{p.code}</span>
                        <Chip label={p.status} />
                        <Chip label={burn > 100 ? "Over Budget" : burn > 85 ? "At Risk" : "Healthy"} tone={tone} />
                      </div>
                      <h3 className="mt-1 truncate text-base font-semibold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.client} · {p.location} · PM {p.manager}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold tabular-nums text-foreground">{burn}%</p>
                      <p className="text-[11px] text-muted-foreground">{t("dash.of")} {fmtShort(p.allocatedBudget)}</p>
                    </div>
                  </div>
                  <div className="mt-3"><ProgressBar value={burn} tone={tone} /></div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                    <div><p className="text-muted-foreground">{t("dash.committed")}</p><p className="font-mono font-semibold tabular-nums text-foreground">{fmtShort(p.poCommitments)}</p></div>
                    <div><p className="text-muted-foreground">{t("dash.actual")}</p><p className="font-mono font-semibold tabular-nums text-foreground">{fmtShort(p.actualExpenses)}</p></div>
                    <div><p className="text-muted-foreground">{t("dash.variance")}</p><p className={`font-mono font-semibold tabular-nums ${p.allocatedBudget - spent < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtShort(p.allocatedBudget - spent)}</p></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("dash.physicalProgress")} {p.progress}%</span>
                    <span>{p.startDate} → {p.endDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><SealCheck className="h-4 w-4 text-amber-500"                     weight="duotone" /> {t("dash.awaitingDecision")}</h3>
            {pendingPRs.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("dash.noOpenRequests")}</p>
            ) : (
              <ul className="space-y-2">
                {pendingPRs.slice(0, 5).map((pr) => (
                  <li key={pr.id} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{pr.code} · {pr.title}</p>
                      <p className="text-[11px] text-muted-foreground">{[...pr.items].reduce((s, i) => s + i.qty * i.estPrice, 0).toLocaleString("en-US")} ETB · required {pr.requiredDate}</p>
                    </div>
                    <Chip label={pr.status} />
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setView("procurement")} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-[0.99]">{t("dash.goToProcurement")}</button>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><ChartBar className="h-4 w-4 text-amber-500"                     weight="duotone" /> {t("dash.recentActivity")}</h3>
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("dash.noActivity")}</p>
            ) : (
              <ol className="relative space-y-3 border-l border-border pl-4">
                {activity.slice(0, 6).map((a: ActivityLog) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-card" />
                    <p className="text-xs font-semibold text-foreground">{a.action}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{a.detail}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">{a.timestamp} · {a.actor}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Warehouse className="h-4 w-4 text-amber-500"                     weight="duotone" /> {t("dash.operationalSnapshot")}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-muted-foreground">{t("dash.suppliers")}</p><p className="font-mono text-base font-bold tabular-nums text-foreground">{state.suppliers.length}</p></div>
              <div><p className="text-muted-foreground">{t("dash.grnsRecorded")}</p><p className="font-mono text-base font-bold tabular-nums text-foreground">{grns.length}</p></div>
              <div><p className="text-muted-foreground">{t("dash.labourEntries")}</p><p className="font-mono text-base font-bold tabular-nums text-foreground">{labor.length}</p></div>
              <div><p className="text-muted-foreground">{t("dash.storesAndSites")}</p><p className="font-mono text-base font-bold tabular-nums text-foreground">{SITES.length}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [role, setRole] = useState<Role>("CEO");
  const [view, setView] = useState<ViewKey>("dashboard");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  const actor = `System ${role}`;

  const pushActivity = (action: string, detail: string) =>
    setState((s) => ({
      ...s,
      activity: [{ id: `ac-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: stamp(), actor, action, detail }, ...s.activity].slice(0, 60),
    }));

  const createProject = (p: Project) => {
    setState((s) => ({ ...s, projects: [p, ...s.projects] }));
    toast.success(`${p.code} created`);
    pushActivity("Project Created", `${p.code} ${p.name} added with ${fmtShort(p.allocatedBudget)} ETB allocated.`);
  };

  const createPR = (pr: PurchaseRequest) => {
    setState((s) => ({ ...s, prs: [pr, ...s.prs] }));
    toast.success(`${pr.code} submitted`);
    pushActivity("PR Submitted", `${pr.code} raised for ${pr.title}.`);
  };

  const updatePR = (pr: PurchaseRequest) => {
    setState((s) => ({ ...s, prs: s.prs.map((x) => (x.id === pr.id ? pr : x)) }));
    pushActivity("PR Updated", `${pr.code} moved to ${pr.status}.`);
  };

  const addQuotation = (q: Quotation) => {
    setState((s) => ({ ...s, quotations: [...s.quotations, q] }));
    toast.success("Quotation recorded");
    pushActivity("Quotation Recorded", `Quote received for request ${q.prId} at ${fmtETB(q.unitPrice)} per unit.`);
  };

  const award = (prId: string, quotationId: string) => {
    let code = "";
    setState((s) => {
      const pr = s.prs.find((x) => x.id === prId);
      const q = s.quotations.find((x) => x.id === quotationId);
      if (!pr || !q) return s;
      const items = pr.items.map((i) => ({ item: i.description, unit: i.unit, qty: i.qty, unitPrice: q.unitPrice }));
      const subtotal = items.reduce((t, i) => t + i.qty * i.unitPrice, 0);
      const vat = Math.round(subtotal * 0.15);
      const seq = 5000 + s.pos.length + 1;
      code = `PO-${seq}`;
      const po: PurchaseOrder = {
        id: `po-${seq}`, code, prId, supplierId: q.supplierId, projectId: pr.projectId,
        issueDate: todayISO(), deliveryDate: pr.requiredDate, status: "Issued", items, subtotal, vat,
        total: subtotal + vat, terms: "Payment 30 days from acceptance. Delivery to the designated project store.",
      };
      const supplier = s.suppliers.find((x) => x.id === q.supplierId);
      return {
        ...s,
        quotations: s.quotations.map((x) => (x.id === quotationId ? { ...x, status: "Awarded" as const } : x)),
        pos: [...s.pos, po],
        projects: s.projects.map((p) => (p.id === pr.projectId ? { ...p, poCommitments: p.poCommitments + po.total } : p)),
        activity: [{ id: `ac-${Date.now()}`, timestamp: stamp(), actor, action: "PO Awarded", detail: `${code} issued to ${supplier?.name ?? "vendor"} against ${pr.code}.` }, ...s.activity].slice(0, 60),
      };
    });
    toast.success(`Awarded · ${code} raised`);
  };

  const generatePO = (po: PurchaseOrder) => {
    setState((s) => ({ ...s, pos: [...s.pos, po] }));
    toast.success(`${po.code} issued`);
  };

  const updatePO = (po: PurchaseOrder) => {
    setState((s) => ({ ...s, pos: s.pos.map((x) => (x.id === po.id ? po : x)) }));
    toast.info(`${po.code} → ${po.status}`);
    pushActivity("PO Status Change", `${po.code} updated to ${po.status}.`);
  };

  const createGRN = (grn: GRN) => {
    setState((s) => ({ ...s, grns: [grn, ...s.grns] }));
    pushActivity("GRN Recorded", `${grn.code} recorded at ${SITES.find((x) => x.id === grn.siteId)?.name ?? "store"} with status ${grn.status}.`);
  };

  const receiveStock = (lines: ReceiptLine[]) => {
    setState((s) => {
      let inventory = [...s.inventory];
      const movements = [...s.movements];
      lines.forEach((ln, idx) => {
        let itemId: string;
        const found = inventory.find((i) => i.name.toLowerCase() === ln.name.toLowerCase() && i.siteId === ln.siteId);
        if (found) {
          itemId = found.id;
          inventory = inventory.map((i) => (i.id === found.id ? { ...i, quantity: i.quantity + ln.qty, unitCost: ln.unitCost || i.unitCost } : i));
        } else {
          itemId = `inv-${Date.now()}-${idx}`;
          inventory = [...inventory, {
            id: itemId, code: `MAT-${ln.name.slice(0, 3).toUpperCase()}-${inventory.length + 1}`, name: ln.name,
            category: ln.category, unit: ln.unit, siteId: ln.siteId, quantity: ln.qty,
            reorderLevel: Math.max(1, Math.round(ln.qty * 0.3)), unitCost: ln.unitCost,
            location: `${SITES.find((x) => x.id === ln.siteId)?.name ?? "Store"} Main Store`,
          } satisfies InventoryItem];
        }
        movements.push({ id: `mv-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`, date: todayISO(), itemId, type: "Receipt", qty: ln.qty, fromSite: "Supplier delivery", toSite: ln.siteId, by: actor, note: "Goods receipt accepted into store" });
      });
      return { ...s, inventory, movements };
    });
    toast.success("Stock updated from goods receipt");
  };

  const issueStock = (itemId: string, qty: number, note: string, siteId: string) => {
    setState((s) => ({
      ...s,
      inventory: s.inventory.map((i) => (i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity - qty) } : i)),
      movements: [...s.movements, { id: `mv-${Date.now()}`, date: todayISO(), itemId, type: "Issuance" as const, qty, fromSite: siteId, toSite: siteId, by: actor, note }],
    }));
  };

  const transferStock = (itemId: string, qty: number, fromSite: string, toSite: string) => {
    setState((s) => {
      const src = s.inventory.find((i) => i.id === itemId);
      if (!src) return s;
      let inventory = s.inventory.map((i) => (i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity - qty) } : i));
      const dest = inventory.find((i) => i.name === src.name && i.siteId === toSite);
      if (dest) {
        inventory = inventory.map((i) => (i.id === dest.id ? { ...i, quantity: i.quantity + qty } : i));
      } else {
        inventory = [...inventory, { ...src, id: `inv-${Date.now()}`, siteId: toSite, quantity: qty, location: `${SITES.find((x) => x.id === toSite)?.name ?? "Store"} Main Store` }];
      }
      return { ...s, inventory, movements: [...s.movements, { id: `mv-${Date.now()}-t`, date: todayISO(), itemId, type: "Transfer" as const, qty, fromSite, toSite, by: actor, note: `Inter-site transfer of ${src.name}` }] };
    });
  };

  const addLabor = (log: LaborLog) => {
    setState((s) => ({ ...s, labor: [...s.labor, log] }));
    pushActivity("Labour Logged", `${log.workerName} (${log.trade}) recorded for ${log.days} day(s).`);
  };

  const addExpense = (exp: ExpenseRecord) => {
    setState((s) => ({
      ...s,
      expenses: [...s.expenses, exp],
      projects: s.projects.map((p) => (p.id === exp.projectId ? { ...p, actualExpenses: p.actualExpenses + exp.amount } : p)),
    }));
    pushActivity("Expense Posted", `${exp.voucher} · ${exp.description} for ${fmtETB(exp.amount)}.`);
  };

  const allowed = navForRole(role);
  const alertCount = state.inventory.filter((i) => i.quantity <= i.reorderLevel).length +
    state.projects.filter((p) => p.poCommitments + p.actualExpenses > p.allocatedBudget).length;

  const changeRole = (r: Role) => {
    setRole(r);
    if (!navForRole(r).some((n) => n.key === view)) setView("dashboard");
  };

  const handleReset = (mode: ResetMode) => {
    setState((s) => {
      const next =
        mode === "fresh"
          ? createFreshBlankState()
          : mode === "seed"
            ? resetToSeedState()
            : mode === "history"
              ? clearHistoryOnly(s)
              : clearAuditLogsOnly(s);
      const label =
        mode === "fresh"
          ? "System Reset — Blank Slate"
          : mode === "seed"
            ? "System Reset — Demo Data"
            : mode === "history"
              ? "Transaction History Cleared"
              : "Audit Trail Cleared";
      return { ...next, activity: [{ id: `ac-${Date.now()}`, timestamp: stamp(), actor, action: label, detail: `Administrator executed ${mode} data-management action.` }, ...next.activity].slice(0, 60) };
    });
  };

  const activeView: ViewKey = allowed.some((n) => n.key === view) ? view : "dashboard";

  return (
    <LanguageProvider>
    <div className="am-app min-h-screen bg-background text-foreground antialiased">
      <Toaster position="top-right" richColors closeButton />
      <NavbarAndRoleHeader
        role={role}
        setRole={changeRole}
        view={activeView}
        setView={setView}
        dark={dark}
        toggleTheme={() => setDark((d) => !d)}
        search={search}
        setSearch={setSearch}
        projects={state.projects}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        alertCount={alertCount}
      />

      <AdminSystemControls role={role} state={state} onReset={handleReset} />

      <main className="mx-auto max-w-[1400px] px-3 pb-24 pt-5 sm:px-5 md:pb-10">
        {activeView === "dashboard" ? (
          <Dashboard role={role} state={state} search={search} projectFilter={projectFilter} setView={setView} />
        ) : null}

        {activeView === "projects" ? (
          <ProjectsAndBudgetView role={role} projects={state.projects} expenses={state.expenses} pos={state.pos} projectFilter={projectFilter} onCreate={createProject} />
        ) : null}

        {activeView === "procurement" ? (
          <ProcurementWorkflowView
            role={role} prs={state.prs} pos={state.pos} quotations={state.quotations} suppliers={state.suppliers}
            projects={state.projects} projectFilter={projectFilter}
            onCreatePR={createPR} onUpdatePR={updatePR} onAddQuotation={addQuotation}
            onAward={award} onGeneratePO={generatePO} onUpdatePO={updatePO} logActivity={pushActivity}
          />
        ) : null}

        {activeView === "inventory" ? (
          <InventoryAndGRNView
            role={role} inventory={state.inventory} grns={state.grns} movements={state.movements}
            pos={state.pos} suppliers={state.suppliers} projects={state.projects} sites={SITES}
            projectFilter={projectFilter} actor={actor}
            onCreateGRN={createGRN} onReceiveStock={receiveStock} onIssueStock={issueStock} onTransferStock={transferStock}
          />
        ) : null}

        {activeView === "labor" ? (
          <LaborExpensesAndReportsView
            role={role} actor={actor} labor={state.labor} expenses={state.expenses} projects={state.projects}
            pos={state.pos} suppliers={state.suppliers} inventory={state.inventory} projectFilter={projectFilter}
            initialTab="labor"
            onAddLabor={addLabor} onAddExpense={addExpense}
          />
        ) : null}

        {activeView === "reports" ? (
          <LaborExpensesAndReportsView
            role={role} actor={actor} labor={state.labor} expenses={state.expenses} projects={state.projects}
            pos={state.pos} suppliers={state.suppliers} inventory={state.inventory} projectFilter={projectFilter}
            initialTab="reports"
            onAddLabor={addLabor} onAddExpense={addExpense}
          />
        ) : null}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>{ORG.name} · {ORG.address}</span>
          <span>TIN {ORG.tin} · {ORG.email} · {ORG.phone}</span>
        </footer>
      </main>
    </div>
    </LanguageProvider>
  );
}