import type { EmiStatus } from "../types";

const styles: Record<EmiStatus, string> = {
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  partial: "bg-amber-100 text-amber-800 border-amber-200",
};

const labels: Record<EmiStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  partial: "Partial",
};

export function StatusBadge({ status }: { status: EmiStatus }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
