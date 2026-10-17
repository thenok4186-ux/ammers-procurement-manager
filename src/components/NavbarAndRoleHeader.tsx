import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ReactNode } from "react";
import {
  Bell,
  Buildings,
  CaretDown,
  ChartBar,
  Check,
  ClipboardText,
  MagnifyingGlass,
  Moon,
  Globe,
  SquaresFour,
  Sun,
  UsersThree,
  Warehouse,
  X,
} from "@phosphor-icons/react";
import type { Project, Role, ViewKey } from "@/types";
import { ORG } from "@/data/initialData";
import { useTranslation } from "@/i18n";

/* ------------------------------ formatters ------------------------------ */
export const fmtETB = (n: number): string =>
  `ETB ${Math.round(n).toLocaleString("en-US")}`;

export const fmtShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

/* ------------------------------ roles & perms ------------------------------ */
export const ROLES: Role[] = [
  "CEO",
  "Operations Manager",
  "Human Resources",
  "Construction Manager",
  "Project Manager",
  "Office Engineer",
  "Finance",
  "Procurement",
  "Architecture",
  "Reception",
];

export type Capability =
  | "createProject"
  | "createPR"
  | "approvePM"
  | "approveFinance"
  | "awardPO"
  | "manageSuppliers"
  | "createGRN"
  | "manageStock"
  | "logLabor"
  | "logExpense";

export const PERMISSIONS: Record<Role, Capability[]> = {
  CEO: ["createProject", "createPR", "approvePM", "approveFinance", "awardPO", "manageSuppliers", "createGRN", "manageStock", "logLabor", "logExpense"],
  "Operations Manager": ["createProject", "createPR", "approvePM", "awardPO", "manageSuppliers", "createGRN", "manageStock", "logLabor", "logExpense"],
  "Human Resources": ["logLabor"],
  "Construction Manager": ["createProject", "createPR", "approvePM", "createGRN", "logLabor", "logExpense"],
  "Project Manager": ["createProject", "createPR", "approvePM", "logLabor", "logExpense"],
  "Office Engineer": ["createPR", "createGRN", "logLabor", "logExpense"],
  Finance: ["approveFinance", "logExpense"],
  Procurement: ["createPR", "awardPO", "manageSuppliers", "manageStock"],
  Architecture: ["createProject", "createPR"],
  Reception: [],
};

export const can = (role: Role, cap: Capability): boolean =>
  PERMISSIONS[role].includes(cap);

export const ROLE_BLURB: Record<Role, string> = {
  CEO: "Sets company strategy and holds full oversight across operations, finance, and projects.",
  "Operations Manager": "Coordinates day-to-day delivery across sites, procurement, stock, and labour.",
  "Human Resources": "Manages workforce records, attendance, and labour deployment across projects.",
  "Construction Manager": "Owns site execution, material approvals, and labour productivity on projects.",
  "Project Manager": "Owns project budgets, approves material requests, and tracks cost centres.",
  "Office Engineer": "Prepares site documentation, raises material requests, and logs labour and expenses.",
  Finance: "Reviews commitments and expenditure against approved project budgets.",
  Procurement: "Sources vendors, runs RFQs, issues POs, and manages supplier compliance.",
  Architecture: "Leads design, drawings, and specification-driven material planning.",
  Reception: "Front-desk coordination, visitor logging, and day-to-day administrative support.",
};

interface NavItem {
  key: ViewKey;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

const ic = "h-[18px] w-[18px]";

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <SquaresFour className={ic} weight="duotone" />, roles: ROLES },
  { key: "projects", label: "Projects & Budget", icon: <Buildings className={ic} weight="duotone" />, roles: ["CEO", "Operations Manager", "Construction Manager", "Project Manager", "Architecture", "Finance"] },
  { key: "procurement", label: "Procurement", icon: <ClipboardText className={ic} weight="duotone" />, roles: ["CEO", "Operations Manager", "Procurement", "Project Manager", "Construction Manager", "Office Engineer", "Finance", "Architecture"] },
  { key: "inventory", label: "Inventory & GRN", icon: <Warehouse className={ic} weight="duotone" />, roles: ["CEO", "Operations Manager", "Procurement", "Construction Manager", "Office Engineer"] },
  { key: "labor", label: "Labour & Expenses", icon: <UsersThree className={ic} weight="duotone" />, roles: ["CEO", "Operations Manager", "Human Resources", "Construction Manager", "Project Manager", "Office Engineer"] },
  { key: "reports", label: "Reports", icon: <ChartBar className={ic} weight="duotone" />, roles: ["CEO", "Operations Manager", "Finance", "Human Resources", "Project Manager", "Construction Manager", "Architecture"] },
];

export const navForRole = (role: Role): NavItem[] =>
  NAV_ITEMS.filter((n) => n.roles.includes(role));

/* ------------------------------ shared UI ------------------------------ */
type Tone = "amber" | "emerald" | "sky" | "rose" | "slate" | "violet";

const TONE_MAP: Record<Tone, string> = {
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  slate: "bg-slate-500/15 text-slate-600 dark:text-slate-300 ring-slate-500/30",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/30",
};

export const statusTone = (label: string): Tone => {
  const l = label.toLowerCase();
  if (/(approved|accepted|fulfilled|compliant|awarded|received|completed|active)$/.test(l)) return "emerald";
  if (/(reject|revision|non-compliant|urgent|on hold|over)/.test(l)) return "rose";
  if (/(pending|inspection|in transit|draft|partial)/.test(l)) return "amber";
  if (/(issued|shortlisted|submitted|medium)/.test(l)) return "sky";
  return "slate";
};

export function Chip({ label, tone }: { label: string; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${TONE_MAP[tone ?? statusTone(label)]}`}>
      {label}
    </span>
  );
}

export function Stat({ label, value, sub, icon, tone = "amber" }: { label: string; value: string; sub?: string; icon: ReactNode; tone?: Tone }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset ${TONE_MAP[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

export function ProgressBar({ value, tone = "amber" }: { value: number; tone?: Tone }) {
  const bg: Record<Tone, string> = {
    amber: "bg-amber-500", emerald: "bg-emerald-500", sky: "bg-sky-500",
    rose: "bg-rose-500", slate: "bg-slate-400", violet: "bg-violet-500",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className={`h-full rounded-full ${bg[tone]}`} />
    </div>
  );
}

export function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function DocShell({ title, meta, onClose, children }: { title: string; meta?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25, ease: "easeOut" }} className="w-full max-w-3xl rounded-2xl bg-white text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500">{title}</p>
            {meta ? <p className="text-sm font-semibold text-slate-800">{meta}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">
              Print
            </button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="Close document">
              <X className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </motion.div>
    </div>
  );
}

export function CompanyBlock() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-amber-600 pb-4">
      <div className="flex items-center gap-3">
        <img
          src={ORG.logoUrl}
          alt={`${ORG.short} logo`}
          className="h-12 w-12 shrink-0 rounded-lg object-contain ring-1 ring-amber-500/30"
        />
        <div>
          <p className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">{ORG.name}</p>
          <p className="text-sm font-medium leading-snug text-amber-700">{ORG.amharicName}</p>
          <p className="mt-0.5 text-xs text-slate-600">{ORG.address}</p>
          <p className="text-xs text-slate-600">TIN {ORG.tin} · {ORG.email} · {ORG.phone}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ navbar ------------------------------ */
interface NavbarProps {
  role: Role;
  setRole: (r: Role) => void;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  dark: boolean;
  toggleTheme: () => void;
  search: string;
  setSearch: (s: string) => void;
  projects: Project[];
  projectFilter: string;
  setProjectFilter: (id: string) => void;
  alertCount: number;
}

export default function NavbarAndRoleHeader({
  role, setRole, view, setView, dark, toggleTheme, search, setSearch,
  projects, projectFilter, setProjectFilter, alertCount,
}: NavbarProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const nav = navForRole(role);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <img
              src={ORG.logoUrl}
              alt={`${ORG.short} logo`}
              className="h-9 w-9 shrink-0 rounded-lg object-contain ring-1 ring-amber-500/30"
            />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-extrabold tracking-tight text-foreground">{ORG.short}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">{t("ui.portalSubtitle")}</p>
            </div>
          </div>

          <div className="relative ml-1 hidden flex-1 items-center md:flex">
            <MagnifyingGlass className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("ui.searchPlaceholder")} className="h-10 w-full max-w-md rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="hidden h-10 max-w-[190px] rounded-lg border border-input bg-card px-2 text-xs font-medium outline-none focus:border-amber-500 lg:block">
              <option value="all">{t("ui.allProjects")}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
            </select>

            <div className="relative">
              <button onClick={() => toast.info(`${alertCount} low-stock and budget alerts require attention`)} className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground" aria-label={t("ui.alerts")}>
                <Bell className="h-[18px] w-[18px]" weight="duotone" />
                {alertCount > 0 ? <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{alertCount}</span> : null}
              </button>
            </div>

            <div className="relative">
              <button onClick={() => setLangOpen((o) => !o)} className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground" aria-label={t("ui.language")}>
                <Globe className="h-[18px] w-[18px]" weight="duotone" />
                <span className="hidden sm:block">{language === "en" ? "EN" : "አማ"}</span>
                <CaretDown className="h-3.5 w-3.5" weight="bold" />
              </button>
              {langOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                    <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("ui.language")}</p>
                    {([["en", "English"], ["am", "አማርኛ"]] as const).map(([code, label]) => (
                      <button key={code} onClick={() => { setLanguage(code); setLangOpen(false); }} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs font-semibold text-foreground transition hover:bg-muted">
                        <span>{label}</span>
                        {language === code ? <Check className="h-3.5 w-3.5 text-amber-500" weight="bold" /> : null}
                      </button>
                    ))}
                  </motion.div>
                </>
              ) : null}
            </div>

            <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground" aria-label={t("ui.toggleTheme")}>
              {dark ? <Sun className="h-[18px] w-[18px]" weight="duotone" /> : <Moon className="h-[18px] w-[18px]" weight="duotone" />}
            </button>

            <div className="relative">
              <button onClick={() => setRoleOpen((o) => !o)} className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-2.5 transition hover:border-amber-500/50">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-300">{role.split(" ").map((w) => w[0]).join("")}</span>
                <span className="hidden text-xs font-semibold text-foreground sm:block">{t(`roles.${role}`)}</span>
                <CaretDown className="h-3.5 w-3.5 text-muted-foreground" weight="bold" />
              </button>
              {roleOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                    <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("ui.switchRole")}</p>
                    {ROLES.map((r) => (
                      <button key={r} onClick={() => { setRole(r); setRoleOpen(false); if (!navForRole(r).some((n) => n.key === view)) setView("dashboard"); toast.success(`${t("ui.nowOperatingAs")} ${t(`roles.${r}`)}`); }} className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-muted">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">{r.split(" ").map((w) => w[0]).join("")}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">{t(`roles.${r}`)}{r === role ? <Check className="h-3 w-3 text-amber-500" weight="bold" /> : null}</span>
                          <span className="block text-[11px] leading-snug text-muted-foreground">{t(`blurb.${r}`)}</span>
                        </span>
                      </button>
                    ))}
                  </motion.div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative border-t border-border/60 bg-card/40">
          <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-2 py-1.5">
            {nav.map((n) => {
              const active = view === n.key;
              return (
                <button key={n.key} onClick={() => setView(n.key)} className={`relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground hover:text-foreground"}`}>
                  {active ? <motion.span layoutId="navpill" className="absolute inset-0 rounded-lg bg-amber-500/15 ring-1 ring-inset ring-amber-500/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} /> : null}
                  <span className="relative">{n.icon}</span>
                  <span className="relative hidden sm:block">{t(`nav.${n.key}`)}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex items-stretch justify-around">
          {nav.slice(0, 5).map((n) => {
            const active = view === n.key;
            return (
              <button key={n.key} onClick={() => setView(n.key)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${active ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                {n.icon}
                <span className="max-w-[64px] truncate">{t(`nav.${n.key}`).split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export type { NavItem };