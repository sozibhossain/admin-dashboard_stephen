export const DOCUMENT_CATEGORY_OPTIONS = [
  { label: "Drawings", value: "drawings" },
  { label: "Invoices", value: "invoices" },
  { label: "Reports", value: "reports" },
  { label: "Contracts", value: "contracts" },
] as const;

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  drawings: "Drawings",
  invoices: "Invoices",
  reports: "Reports",
  contracts: "Contracts",
};

export const formatDocumentCategory = (category?: string | null) =>
  DOCUMENT_CATEGORY_LABELS[String(category ?? "").trim().toLowerCase()] ??
  String(category ?? "-");

export const getInitials = (name?: string | null) => {
  const raw = String(name || "").trim();
  if (!raw) return "NA";

  const parts = raw.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

export const formatRelativeTime = (dateValue?: string) => {
  if (!dateValue) return "";

  const parsed = new Date(dateValue).getTime();
  if (Number.isNaN(parsed)) return "";

  const diffMs = Math.max(Date.now() - parsed, 0);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "JUST NOW";
  if (diffMinutes < 60) return `${diffMinutes}M AGO`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}H AGO`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}D AGO`;
};

export const ensureArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];
