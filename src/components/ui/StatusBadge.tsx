import type { ReactNode } from "react";

const STATUS_MAP: Record<string, string> = {
  Pending: "badge--amber",
  Confirmed: "badge--blue",
  Processing: "badge--purple",
  Dispatched: "badge--sky",
  Delivered: "badge--green",
  Cancelled: "badge--red",
  Paid: "badge--green",
  Failed: "badge--red",
  Refunded: "badge--gray",
  active: "badge--green",
  inactive: "badge--gray",
  draft: "badge--amber",
  out_of_stock: "badge--red",
  expired: "badge--red",
  low_stock: "badge--amber",
  in_stock: "badge--green",
};

function labelize(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({
  status,
  children,
}: {
  status: string;
  children?: ReactNode;
}) {
  const tone = STATUS_MAP[status] || "badge--gray";
  return <span className={`badge ${tone}`}>{children ?? labelize(status)}</span>;
}
