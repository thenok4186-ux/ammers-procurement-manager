import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowsClockwise,
  Broom,
  CheckSquare,
  ClockCounterClockwise,
  Database,
  DownloadSimple,
  Gear,
  Scroll,
  ShieldCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { ResetMode, Role } from "@/types";
import type { AppState } from "@/data/initialData";
import { useTranslation } from "@/i18n";

const isoDay = (): string => new Date().toISOString().slice(0, 10);

interface ModeMeta {
  key: ResetMode;
  icon: ReactNode;
  titleKey: string;
  descKey: string;
  danger: "high" | "medium";
  /* collections this mode wipes (drives the preview grid) */
  wipes: (keyof AppState)[];
}

const MODES: ModeMeta[] = [
  {
    key: "fresh",
    icon: <Broom className="h-5 w-5" weight="duotone" />,
    titleKey: "admin.mode.fresh.title",
    descKey: "admin.mode.fresh.desc",
    danger: "high",
    wipes: ["projects", "prs", "quotations", "pos", "suppliers", "grns", "inventory", "movements", "labor", "expenses", "activity"],
  },
  {
    key: "seed",
    icon: <ArrowsClockwise className="h-5 w-5" weight="duotone" />,
    titleKey: "admin.mode.seed.title",
    descKey: "admin.mode.seed.desc",
    danger: "medium",
    wipes: ["projects", "prs", "quotations", "pos", "suppliers", "grns", "inventory", "movements", "labor", "expenses", "activity"],
  },
  {
    key: "history",
    icon: <Scroll className="h-5 w-5" weight="duotone" />,
    titleKey: "admin.mode.history.title",
    descKey: "admin.mode.history.desc",
    danger: "medium",
    wipes: ["prs", "quotations", "pos", "grns", "movements", "labor", "expenses", "activity"],
  },
  {
    key: "audit",
    icon: <ClockCounterClockwise className="h-5 w-5" weight="duotone" />,
    titleKey: "admin.mode.audit.title",
    descKey: "admin.mode.audit.desc",
    danger: "medium",
    wipes: ["activity"],
  },
];

const COLLECTION_LABEL: Record<string, string> = {
  projects: "Projects",
  prs: "PRs",
  quotations: "RFQs",
  pos: "POs",
  suppliers: "Suppliers",
  grns: "GRNs",
  inventory: "Stock",
  movements: "Movements",
  labor: "Labour",
  expenses: "Expenses",
  activity: "Audit Log",
};

interface Props {
  role: Role;
  state: AppState;
  onReset: (mode: ResetMode) => void;
}

export default function AdminSystemControls({ role, state, onReset }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ResetMode>("fresh");
  const [confirmText, setConfirmText] = useState("");

  const totalRecords = useMemo(
    () =>
      (["projects", "prs", "quotations", "pos", "suppliers", "grns", "inventory", "movements", "labor", "expenses"] as const).reduce(
        (sum, k) => sum + (state[k] as unknown[]).length,
        0,
      ),
    [state],
  );

  const lastModified = state.activity[0]?.timestamp ?? "—";
  const activeMode = MODES.find((m) => m.key === selected) ?? MODES[0];
  const ready = confirmText.trim().toUpperCase() === "CLEAR";

  if (role !== "CEO") return null;

  const downloadBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gebeya-erp-backup-${isoDay()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("admin.toast.backup"));
    } catch {
      toast.error(t("admin.toast.backupFail"));
    }
  };

  const execute = () => {
    if (!ready) return;
    onReset(selected);
    toast.success(t(`admin.toast.${selected}`));
    setOpen(false);
    setConfirmText("");
  };

  const openModal = () => {
    setSelected("fresh");
    setConfirmText("");
    setOpen(true);
  };

  return (
    <>
      {/* ---------------- Admin system control bar ---------------- */}
      <div className="mx-auto max-w-[1400px] px-3 pt-3 sm:px-5">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15 text-amber-600 ring-1 ring-inset ring-amber-500/30 dark:text-amber-400">
              <Gear className="h-5 w-5" weight="duotone" />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{t("admin.barEyebrow")}</p>
              <p className="text-sm font-semibold text-foreground">{t("admin.barTitle")}</p>
              <p className="text-[11px] text-muted-foreground">{t("admin.barSub")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
              <Database className="h-3.5 w-3.5 text-emerald-500" weight="duotone" />
              {totalRecords} {t("admin.records")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
              <ClockCounterClockwise className="h-3.5 w-3.5 text-sky-500" weight="duotone" />
              {lastModified}
            </span>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.99]"
            >
              <Broom className="h-4 w-4" weight="bold" />
              {t("admin.barOpen")}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ---------------- Reset modal ---------------- */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/20">
                    <WarningCircle className="h-5 w-5" weight="duotone" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-900">{t("admin.modal.title")}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{t("admin.modal.subtitle")}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200" aria-label="Close">
                  <X className="h-4 w-4" weight="bold" />
                </button>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_1fr]">
                {/* mode selector */}
                <div className="space-y-2">
                  {MODES.map((m) => {
                    const active = selected === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSelected(m.key)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                          active ? "border-amber-500 bg-amber-500/[0.07] ring-1 ring-inset ring-amber-500/30" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${active ? "bg-amber-500/15 text-amber-600 ring-amber-500/30" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
                          {m.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{t(m.titleKey)}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${m.danger === "high" ? "bg-rose-500/10 text-rose-600 ring-rose-500/20" : "bg-amber-500/10 text-amber-700 ring-amber-500/20"}`}>
                              {t(`admin.danger.${m.danger}`)}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{t(m.descKey)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* preview + backup */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <ShieldCheck className="h-4 w-4 text-amber-600" weight="duotone" />
                      {t("admin.modal.preview")}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {activeMode.wipes.map((k) => (
                        <div key={k} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-inset ring-slate-200">
                          <span className="text-[11px] font-medium text-slate-600">{COLLECTION_LABEL[k] ?? k}</span>
                          <span className="font-mono text-sm font-bold tabular-nums text-rose-600">{(state[k] as unknown[]).length}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-300 p-4">
                    <p className="text-xs font-semibold text-slate-700">{t("admin.modal.backup")}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{t("admin.modal.backupHint")}</p>
                    <button onClick={downloadBackup} className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]">
                      <DownloadSimple className="h-4 w-4" weight="bold" />
                      {t("admin.modal.backup")}
                    </button>
                  </div>
                </div>
              </div>

              {/* footer: confirm guard */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-600">{t("admin.modal.confirmLabel")}</label>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={t("admin.modal.confirmPlaceholder")}
                    className="h-9 w-28 rounded-lg border border-slate-300 bg-white px-2.5 font-mono text-xs uppercase tracking-widest outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                    {t("admin.modal.cancel")}
                  </button>
                  <button
                    onClick={execute}
                    disabled={!ready}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.99] ${
                      ready ? "bg-rose-600 hover:bg-rose-700" : "cursor-not-allowed bg-slate-300"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" weight="bold" />
                    {t("admin.modal.execute")}
                  </button>
                </div>
              </div>
              {!ready ? <p className="bg-amber-500/[0.06] px-5 py-2 text-center text-[11px] font-medium text-amber-700 dark:text-amber-600">{t("admin.modal.locked")}</p> : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}