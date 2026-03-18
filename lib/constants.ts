export const APP_NAME = "Stephen Construction Admin";
export const DASHBOARD_CATEGORY = "construction" as const;
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTPUBLICBASEURL ??
  "http://localhost:5000/api/v1";

export const QUERY_STALE_TIME = 1000 * 30;

export const PROJECT_CATEGORIES = [
  { label: "Construction", value: "construction" },
] as const;

