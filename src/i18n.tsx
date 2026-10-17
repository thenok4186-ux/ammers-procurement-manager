import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  English & Amharic language system with localStorage persistence.  */
/* ------------------------------------------------------------------ */

export type Language = "en" | "am";

const STORAGE_KEY = "gebeya_erp_lang";

type Entry = { en: string; am: string };

const T: Record<string, Entry> = {
  /* restructured role dictionary (9 new roles; Project Manager retained below) */
  "roles.CEO": { en: "CEO", am: "ዋና ሥራ አስኪያጅ" },
  "roles.Operations Manager": { en: "Operations Manager", am: "የኦፕሬሽን ሥራ አስኪያጅ" },
  "roles.Human Resources": { en: "Human Resources", am: "የሰው ሃብት" },
  "roles.Construction Manager": { en: "Construction Manager", am: "የግንባታ ሥራ አስኪያጅ" },
  "roles.Office Engineer": { en: "Office Engineer", am: "የቢሮ መሐንዲስ" },
  "roles.Finance": { en: "Finance", am: "ፋይናንስ" },
  "roles.Procurement": { en: "Procurement", am: "ግዢ" },
  "roles.Architecture": { en: "Architecture", am: "ሐሳብ ንድፍ" },
  "roles.Reception": { en: "Reception", am: "ቅብብል" },

  "blurb.CEO": { en: "Sets company strategy and holds full oversight across operations, finance, and projects.", am: "የድርጅቱን ስትራቴጂ ይወስናል፤ በኦፕሬሽን፣ ፋይናንስና ፕሮጀክቶች ላይ ሙሉ ቁጥጥር ይይዛል።" },
  "blurb.Operations Manager": { en: "Coordinates day-to-day delivery across sites, procurement, stock, and labour.", am: "በተለያዩ ጣቢያዎች፣ ግዢ፣ ዕቃና ጉልበት ላይ ዕለታዊ አሠራተ ሥራን ያስተባብራል።" },
  "blurb.Human Resources": { en: "Manages workforce records, attendance, and labour deployment across projects.", am: "የሠራተኛ መዝገብ፣ ቅሬታና በፕሮጀክቶች ላይ የጉልበት ክፍፍል ያስተዳድራል።" },
  "blurb.Construction Manager": { en: "Owns site execution, material approvals, and labour productivity on projects.", am: "የግንባታ ሥራ፣ የቁሳቁስ ግምገማና የጉልበት ምርት ላይ ባለስልጣን ነው።" },
  "blurb.Office Engineer": { en: "Prepares site documentation, raises material requests, and logs labour and expenses.", am: "የግንባታ ሰነድ ያዘጋጃል፣ የቁሳቁስ ጥያቄ ያቀርባል፣ ጉልበትና ወጪ ይመዘግባል።" },
  "blurb.Finance": { en: "Reviews commitments and expenditure against approved project budgets.", am: "ከጸደቁ የፕሮጀክት በጀቶች ጋር ተጠያቂነትና ወጪ ይገመግማል።" },
  "blurb.Procurement": { en: "Sources vendors, runs RFQs, issues POs, and manages supplier compliance.", am: "አቅራቢ ይፈልጋል፣ RFQ ያካሄዳል፣ የግዢ ትዕዛዝ ይሰጣል፣ የአቅራቢ ተገቢነትን ያስተዳድራል።" },
  "blurb.Architecture": { en: "Leads design, drawings, and specification-driven material planning.", am: "ንድፍ፣ ስዕሎችና በመመሪያ ላይ የተመሰረተ የቁሳቁስ ዕቅድ ይመራል።" },
  "blurb.Reception": { en: "Front-desk coordination, visitor logging, and day-to-day administrative support.", am: "የቅብብል ድርጊት፣ የጎብኚ መዝገብና ዕለታዊ የአስተዳደር ድጋፍ።" },

  "action.CEO.title": { en: "Executive Overview", am: "የአመራር አጠቃላይ እይታ" },
  "action.CEO.cta": { en: "Open Procurement", am: "ግዢ ክፈት" },
  "action.CEO.body": { en: "{a} projects · {b} requests awaiting decision", am: "{a} ፕሮጀክቶች · {b} ጥያቄዎች ውሳኔ ይጠብቃሉ" },
  "action.Operations Manager.title": { en: "Operations Control", am: "የኦፕሬሽን ቁጥጥር" },
  "action.Operations Manager.cta": { en: "Manage Operations", am: "ኦፕሬሽን አስተዳድር" },
  "action.Operations Manager.body": { en: "{a} approved requests to source · {b} live orders", am: "{a} የጸደቁ ጥያቄዎች · {b} ንቁ ትዕዛዞች" },
  "action.Human Resources.title": { en: "Workforce & Labour", am: "ሠራተኛና ጉልበት" },
  "action.Human Resources.cta": { en: "Open Labour", am: "ጉልበት ክፈት" },
  "action.Human Resources.body": { en: "{a} labour entries this period", am: "{a} የጉልበት መረጃዎች በዚህ ጊዜ" },
  "action.Construction Manager.title": { en: "Site Execution", am: "የግንባታ ሥራ" },
  "action.Construction Manager.cta": { en: "Review Requests", am: "ጥያቄዎችን ገምግም" },
  "action.Construction Manager.body": { en: "{a} material requests need your decision", am: "{a} የቁሳቁስ ጥያቄዎች ውሳኔዎ ያስፈልጋቸዋል" },
  "action.Office Engineer.title": { en: "Site Documentation", am: "የግንባታ ሰነድ" },
  "action.Office Engineer.cta": { en: "Log Site Costs", am: "የግንባታ ወጪዎችን መዝግብ" },
  "action.Office Engineer.body": { en: "{a} open requests · log labour and expenses", am: "{a} ክፍት ጥያቄዎች · ጉልበትና ወጪ ይመዝግቡ" },
  "action.Finance.title": { en: "Commitment Review", am: "የተጠያቂነት ግምገማ" },
  "action.Finance.cta": { en: "Review Budgets", am: "በጀቶችን ገምግም" },
  "action.Finance.body": { en: "{a} committed against {b} allocated", am: "{a} ተጠያቂ ከ{b} የተመደበ" },
  "action.Procurement.title": { en: "Sourcing Queue", am: "የግዢ ወረፋ" },
  "action.Procurement.cta": { en: "Manage Sourcing", am: "ግዢ አስተዳድር" },
  "action.Procurement.body": { en: "{a} approved requests to source · {b} live orders", am: "{a} የጸደቁ ጥያቄዎች ለግዢ · {b} ንቁ ትዕዛዞች" },
  "action.Architecture.title": { en: "Design & Specs", am: "ንድፍና መመሪያ" },
  "action.Architecture.cta": { en: "Open Projects", am: "ፕሮጀክቶችን ክፈት" },
  "action.Architecture.body": { en: "{a} projects under design · {b} requests raised", am: "{a} ፕሮጀክቶች በንድፍ ላይ · {b} ጥያቄዎች ቀርበዋል" },
  "action.Reception.title": { en: "Front Desk", am: "ቅብብል" },
  "action.Reception.cta": { en: "Open Dashboard", am: "ዳሽቦርድ ክፈት" },
  "action.Reception.body": { en: "{a} projects in portfolio", am: "{a} ፕሮጀክቶች በድርጅቱ" },
  /* navigation tabs */
  "nav.dashboard": { en: "Dashboard", am: "ዳሽቦርድ" },
  "nav.projects": { en: "Projects & Budget", am: "ፕሮጀክቶችና በጀት" },
  "nav.procurement": { en: "Procurement", am: "ግዥና አቅርቦት" },
  "nav.inventory": { en: "Inventory & GRN", am: "ክምችትና ዕቃ መቀበያ" },
  "nav.labor": { en: "Labour & Expenses", am: "የጉልበትና ወጪ" },
  "nav.reports": { en: "Reports", am: "ሪፖርቶች" },

  /* role titles */
  "roles.Administrator": { en: "Administrator", am: "አስተዳዳሪ" },
  "roles.Procurement Officer": { en: "Procurement Officer", am: "የግዥ ኃላፊ" },
  "roles.Project Manager": { en: "Project Manager", am: "ፕሮጀክት ሥራ አስኪያጅ" },
  "roles.Storekeeper": { en: "Storekeeper", am: "የዕቃ ግምጃ ቤት ኃላፊ" },
  "roles.Finance Officer": { en: "Finance Officer", am: "የፋይናንስ ኃላፊ" },
  "roles.Site Engineer": { en: "Site Engineer", am: "ሳይት መሐንዲስ" },

  /* role blurbs */
  "blurb.Administrator": {
    en: "Full system oversight across procurement, stock, finance, and projects.",
    am: "በግዥ፣ በክምችት፣ በፋይናንስና በፕሮጀክቶች ላይ ሙሉ የስርዓት ክትትል።",
  },
  "blurb.Procurement Officer": {
    en: "Sources vendors, runs RFQs, issues POs, and manages supplier compliance.",
    am: "አቅራቢዎችን ያገኛል፣ RFQ ያካሄዳል፣ የአቅራቢ ትዕዛዝ ይሰጣል፣ የአቅራቢ ተገቢነትን ይቆጣጠራል።",
  },
  "blurb.Project Manager": {
    en: "Owns project budgets, approves material requests, and tracks cost centres.",
    am: "የፕሮጀክት በጀቶችን ይይዛል፣ የቁሳቁስ ጥያቄዎችን ያጸድቃል፣ የወጪ ማዕከሎችን ይከታተላል።",
  },
  "blurb.Storekeeper": {
    en: "Controls site stores, inspects deliveries, and records stock movements.",
    am: "የግምጃ ቤቶችን ይቆጣጠራል፣ አድራሾችን ይመረምራል፣ የክምችት እንቅስቃሴዎችን ይመዘግባል።",
  },
  "blurb.Finance Officer": {
    en: "Reviews commitments and expenditure against approved project budgets.",
    am: "ግዴታዎችንና ወጪዎችን በጸደቁ የፕሮጀክት በጀቶች ይገመግማል።",
  },
  "blurb.Site Engineer": {
    en: "Raises site material requests and logs labour and direct site expenses.",
    am: "የሥፍራ ቦታ የቁሳቁስ ጥያቄዎችን ያነሳል፣ ጉልበትና ቀጥተኛ የሥፍራ ወጪዎችን ይመዘግባል።",
  },

  /* header / navbar UI */
  "ui.portalSubtitle": { en: "Integrated ERP Portal", am: "የተቀናጀ ኢ.አር.ፒ ፖርታል" },
  "ui.searchPlaceholder": {
    en: "Search projects, PRs, POs, suppliers, materials...",
    am: "ፕሮጀክቶችን፣ ግዥ ጥያቄዎችን፣ ትዕዛዞችን፣ አቅራቢዎችን፣ ቁሳቁሶችን ይፈልጉ...",
  },
  "ui.allProjects": { en: "All Projects", am: "ሁሉም ፕሮጀክቶች" },
  "ui.alerts": { en: "Alerts", am: "ማንቂያዎች" },
  "ui.toggleTheme": { en: "Toggle theme", am: "ገጽታ ቀይር" },
  "ui.language": { en: "Language", am: "ቋንቋ" },
  "ui.switchRole": { en: "Switch operating role", am: "የሚሰሩበትን ሚና ቀይር" },
  "ui.nowOperatingAs": { en: "Now operating as", am: "አሁን እየሰሩት ያለው" },
  "ui.actionPanel": { en: "Action panel", am: "የእርምጃ ሰሌዳ" },
  "ui.signedInAs": { en: "Signed in as", am: "የገባው" },

  /* dashboard stats */
  "stat.allocatedBudget": { en: "Allocated Budget", am: "የተመደበ በጀት" },
  "stat.poCommitments": { en: "PO Commitments", am: "የአቅራቢ ትዕዛዝ ግዴታ" },
  "stat.actualSpend": { en: "Actual Spend", am: "ተጨባጭ ወጪ" },
  "stat.stockValuation": { en: "Stock Valuation", am: "የክምችት ዋጋ" },
  "stat.openRequests": { en: "Open Requests", am: "ክፍት ጥያቄዎች" },
  "stat.stockAlerts": { en: "Stock Alerts", am: "የክምችት ማንቂያ" },

  /* dashboard stat sub-labels */
  "sub.purchaseOrders": { en: "purchase orders", am: "የአቅራቢ ትዕዛዞች" },
  "sub.expenseVouchers": { en: "expense vouchers", am: "የወጪ ማረጋጊያዎች" },
  "sub.materialLines": { en: "material lines", am: "የቁሳቁስ መስመሮች" },
  "sub.totalPRsRaised": { en: "total PRs raised", am: "አጠቃላይ የተነሱ ጥያቄዎች" },
  "sub.projectsOverBudget": { en: "projects over budget", am: "ከበጀት በላይ ፕሮጀክቶች" },
  "sub.budgetsWithinLimit": { en: "Budgets within limit", am: "በጀቶች ወሰን ውስጥ" },

  /* dashboard headers & sections */
  "dash.heroEyebrow": {
    en: "Integrated Procurement · Inventory · Projects",
    am: "የተቀናጀ ግዥ · ክምችት · ፕሮጀክቶች",
  },
  "dash.projectBudgetControl": { en: "Project Budget Control", am: "የፕሮጀክት በጀት ቁጥጥር" },
  "dash.budgetControlSub": {
    en: "Allocated budget against PO commitments and actual expenditure",
    am: "የተመደበ በጀት ከአቅራቢ ትዕዛዝ ግዴታና ተጨባጭ ወጪ ጋር",
  },
  "dash.openProjectRegister": { en: "Open project register", am: "የፕሮጀክት ምዝገባ ክፈት" },
  "dash.noProjectsMatch": {
    en: "No projects match the current filter or search.",
    am: "የአሁኑን ማጣሪያ ወይም ፍለጋ የሚያሟሉ ፕሮጀክቶች የሉም።",
  },
  "dash.awaitingDecision": { en: "Awaiting Your Decision", am: "በእርስዎ ውሳኔ ላይ የሚጠቡ" },
  "dash.noOpenRequests": {
    en: "No open requests. Every purchase request has been resolved.",
    am: "ክፍት ጥያቄዎች የሉም። ሁሉም የግዥ ጥያቄዎች ተፈትተዋል።",
  },
  "dash.goToProcurement": { en: "Go to procurement workflow", am: "ወደ ግዥ ሂደት ሂድ" },
  "dash.recentActivity": { en: "Recent Activity", am: "ቅርብ እንቅስቃሴ" },
  "dash.noActivity": { en: "No activity recorded yet.", am: "እስካሁን ምንም እንቅስቃሴ አልተመዘገበም።" },
  "dash.operationalSnapshot": { en: "Operational Snapshot", am: "የኦፕሬሽን አጠቃላይ እይታ" },
  "dash.suppliers": { en: "Suppliers", am: "አቅራቢዎች" },
  "dash.grnsRecorded": { en: "GRNs recorded", am: "የተመዘገቡ መቀበያዎች" },
  "dash.labourEntries": { en: "Labour entries", am: "የጉልበት መዝገቦች" },
  "dash.storesAndSites": { en: "Stores & sites", am: "ግምጃ ቤቶችና ሥፍራዎች" },
  "dash.committed": { en: "Committed", am: "ተገዢ" },
  "dash.actual": { en: "Actual", am: "ተጨባጭ" },
  "dash.variance": { en: "Variance", am: "ልዩነት" },
  "dash.physicalProgress": { en: "Physical progress", am: "ተጨባጭ እድገት" },
  "dash.of": { en: "of", am: "ከ" },

  /* action panel cards (title + cta) */
  "action.Administrator.title": { en: "Portfolio Governance", am: "የፖርትፎሊዝ አስተዳደር" },
  "action.Administrator.cta": { en: "Open Procurement", am: "ግዥ ክፈት" },
  "action.Procurement Officer.title": { en: "Sourcing Queue", am: "የግዥ ወረፋ" },
  "action.Procurement Officer.cta": { en: "Manage Sourcing", am: "ግዥ አስተዳድር" },
  "action.Project Manager.title": { en: "Budget Approvals", am: "የበጀት ማጽደቆች" },
  "action.Project Manager.cta": { en: "Review Requests", am: "ጥያቄዎችን ገምግም" },
  "action.Storekeeper.title": { en: "Store Controls", am: "የግምጃ ቤት ቁጥጥር" },
  "action.Storekeeper.cta": { en: "Open Stock Control", am: "የክምችት ቁጥጥር ክፈት" },
  "action.Finance Officer.title": { en: "Commitment Review", am: "የግዴታ ግምገማ" },
  "action.Finance Officer.cta": { en: "Review Budgets", am: "በጀቶችን ገምግም" },
  "action.Site Engineer.title": { en: "Site Requests", am: "የሥፍራ ቦታ ጥያቄዎች" },
  "action.Site Engineer.cta": { en: "Log Site Costs", am: "የሥፍራ ወጪዎችን መዝግብ" },

  /* action panel card bodies (with {n} placeholders) */
  "action.Administrator.body": { en: "{a} projects · {b} requests awaiting decision", am: "{a} ፕሮጀክቶች · {b} ጥያቄዎች ውሳኔ ይጠብቃሉ" },
  "action.Procurement Officer.body": { en: "{a} approved requests to source · {b} live orders", am: "{a} የጸደቁ ጥያቄዎች ለግዥ · {b} ንቁ ትዕዛዞች" },
  "action.Project Manager.body": { en: "{a} material requests need your decision", am: "{a} የቁሳቁስ ጥያቄዎች ውሳኔዎ ያስፈልጋቸዋል" },
  "action.Storekeeper.body": { en: "{a} lines at or below reorder level", am: "{a} መስመሮች በዳግም ማዘዣ ደረጃ ወይም ከዚያ በታች" },
  "action.Finance Officer.body": { en: "{a} committed against {b} allocated", am: "{a} ተገዢ ከ{b} የተመደበ ጋር" },
  "action.Site Engineer.body": { en: "{a} open requests · log labour and expenses", am: "{a} ክፍት ጥያቄዎች · ጉልበትና ወጪዎችን ይመዝግቡ" },

  /* common action verbs */
  "common.createPR": { en: "Create PR", am: "ግዥ ጥያቄ ፍጠር" },
  "common.receiveItems": { en: "Receive Items", am: "ዕቃ ተቀበል" },
  "common.addExpense": { en: "Add Expense", am: "ወጪ ጨምር" },
  "common.export": { en: "Export", am: "ላክ" },
  "common.filter": { en: "Filter", am: "አጣራ" },
  "common.save": { en: "Save", am: "አስቀምጥ" },
  "common.cancel": { en: "Cancel", am: "ሰርዝ" },
  "common.create": { en: "Create", am: "ፍጠር" },
  "common.delete": { en: "Delete", am: "አጥፋ" },
  "common.approve": { en: "Approve", am: "ፍቀድ" },
  "common.reject": { en: "Reject", am: "ውድቅ" },
  "common.search": { en: "Search", am: "ፈልግ" },
  "common.status": { en: "Status", am: "ሁኔታ" },
  "common.view": { en: "View", am: "አይ" },
  "common.print": { en: "Print", am: "አትም" },
  /* administrator system controls & clear-history modal */
  "admin.barEyebrow": { en: "System Controls", am: "የስርዓት ቁጥጥሮች" },
  "admin.barTitle": { en: "Administrator Console", am: "የአስተዳዳሪ ኮንሶል" },
  "admin.barSub": { en: "Manage demo data, clear history, or start fresh.", am: "ናሙና መረጃን ያስተዳድሩ፣ ታሪክ ያጽዱ፣ ወይም አዲስ ይጀምሩ።" },
  "admin.barStatus": { en: "Local storage active", am: "የአካባቢ ማከማቻ ንቁ ነው" },
  "admin.barOpen": { en: "Clear History & Start Fresh", am: "ታሪክ አጽድ እና አዲስ ጀምር" },
  "admin.records": { en: "records", am: "መዝገቦች" },
  "admin.modal.title": { en: "System Data Management", am: "የስርዓት መረጃ አስተዳደር" },
  "admin.modal.subtitle": { en: "Reset, re-seed, or clear the portal dataset. These actions are permanent.", am: "የፖርታሉን መረጃ እንደገና ያስጀምሩ፣ ይሙሉ፣ ወይም ያጽዱ። እነዚህ እርምጃዎች ለዘላቸው ናቸው።" },
  "admin.modal.backup": { en: "Download JSON Backup", am: "የ JSON ጐባብ ያውርዱ" },
  "admin.modal.backupHint": { en: "Export the current dataset before clearing.", am: "ከማጽዳት በፊት የአሁኑን መረጃ ይላኩ።" },
  "admin.modal.preview": { en: "Affected records", am: "የሚጎዱ መዝገቦች" },
  "admin.modal.confirmLabel": { en: "Type CLEAR to confirm", am: "ለማረጋገጥ CLEAR ይተይቡ" },
  "admin.modal.confirmPlaceholder": { en: "CLEAR", am: "CLEAR" },
  "admin.modal.cancel": { en: "Cancel", am: "ሰርዝ" },
  "admin.modal.execute": { en: "Execute Action", am: "እርምጃውን ማከናወን" },
  "admin.modal.locked": { en: "Type CLEAR to enable this action.", am: "ይህን እርምጃ ለማንቃ CLEAR ይተይቡ።" },
  "admin.mode.fresh.title": { en: "Start Fresh (Blank Slate)", am: "አዲስ ጀምር (ባዶ ሰሌዳ)" },
  "admin.mode.fresh.desc": { en: "Clear every project, PR, PO, GRN, stock, labour and expense record to begin live operations from scratch.", am: "ሁሉንም ፕሮጀክት፣ PR፣ PO፣ GRN፣ ክምችት፣ ሥራ እና ወጪ መዝገቦችን አጽድት ከዜሮ ተግባራዊ ስራ ለመጀመር።" },
  "admin.mode.seed.title": { en: "Reset to Sample Demo Data", am: "ወደ ናሙና መረጃ እንደገና አስጀምር" },
  "admin.mode.seed.desc": { en: "Restore the original seeded projects, suppliers, inventory and workflow records.", am: "የመጀመሪያ ፕሮጀክቶች፣ አቅርቦቶች፣ ክምችት እና የሥራ ፍሰት መዝገቦችን ወደ ኋላ መልሰው።" },
  "admin.mode.history.title": { en: "Clear Transaction History Only", am: "የግብይት ታሪክ ብቻ አጽዳ" },
  "admin.mode.history.desc": { en: "Keep master projects, suppliers and inventory; clear all PRs, RFQs, POs, GRNs, labour and expense vouchers.", am: "ዋና ፕሮጀክቶች፣ አቅርቦቶች እና ክምችት ይግዙ፤ ሁሉንም PR፣ RFQ፣ PO፣ GRN፣ ሥራ እና የወጪ ማስረጃዎች ያጽዱ።" },
  "admin.mode.audit.title": { en: "Clear Activity Audit Trail", am: "የእንቅስቃሴ መመርመሪያ ታሪክ አጽዳ" },
  "admin.mode.audit.desc": { en: "Wipe the activity log while keeping every record intact.", am: "እያንዳንዱ መዝገብ ሳይነካ የእንቅስቃሴ መዝገቡን ያጽዱ።" },
  "admin.danger.high": { en: "Destructive", am: "አዕምሮ ሹል" },
  "admin.danger.medium": { en: "Moderate", am: "መካከለኛ" },
  "admin.toast.fresh": { en: "System cleared — starting fresh with a blank slate.", am: "ስርዓቱ ተጽድቷል — በባዶ ሰሌዳ አዲስ ተጀምሯል።" },
  "admin.toast.seed": { en: "Demo data restored to original seed state.", am: "የናሙና መረጃ ወደ መጀመሪያ ሁኔታ ተመልሷል።" },
  "admin.toast.history": { en: "Transaction history cleared; master data kept.", am: "የግብይት ታሪክ ተጽድቷል፤ ዋና መረጃ ተጠብቋል።" },
  "admin.toast.audit": { en: "Activity audit trail cleared.", am: "የእንቅስቃሴ መመርመሪያ ታሪክ ተጽድቷል።" },
  "admin.toast.backup": { en: "JSON backup downloaded.", am: "የ JSON ጐባብ ተወርዷል።" },
  "admin.toast.backupFail": { en: "Backup failed — storage unavailable.", am: "ጐባብ አልተሳካም — ማከማቻ አይገኝም።" },
};

interface LangCtx {
  language: Language;
  setLanguage: (l: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LangCtx | null>(null);

function readInitial(): Language {
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "am") return saved;
    } catch {
      /* ignore */
    }
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LangCtx>(() => {
    const t = (key: string, fallback?: string) => {
      const entry = T[key];
      if (entry) return entry[language];
      return fallback ?? key;
    };
    return {
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((l) => (l === "en" ? "am" : "en")),
      t,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LangCtx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  return ctx;
}