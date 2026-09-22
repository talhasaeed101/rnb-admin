import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  icon: ReactNode;
  className?: string;
}

export function StatCard({ label, value, meta, icon, className }: StatCardProps) {
  return (
    <article className={["stat-card", className].filter(Boolean).join(" ")}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {meta ? <div className="stat-card__meta">{meta}</div> : null}
    </article>
  );
}
