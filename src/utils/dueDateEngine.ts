import {
  addMonths,
  format,
  getDate,
  lastDayOfMonth,
  parseISO,
  setDate,
} from "date-fns";
export interface DueDateResult {
  scheduledDueDate: string;
  effectiveDueDate: string;
}

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Same calendar day each month; clamp to last day if needed */
export function getScheduledDueDate(loanStartDate: string, installmentNumber: number): Date {
  const start = parseISO(loanStartDate);
  const dayOfMonth = getDate(start);
  const targetMonth = addMonths(start, installmentNumber - 1);
  const lastDay = getDate(lastDayOfMonth(targetMonth));
  const safeDay = Math.min(dayOfMonth, lastDay);
  return setDate(targetMonth, safeDay);
}

export function resolveDueDate(
  loanStartDate: string,
  installmentNumber: number
): DueDateResult {
  const scheduled = getScheduledDueDate(loanStartDate, installmentNumber);
  const dateStr = toDateStr(scheduled);
  return {
    scheduledDueDate: dateStr,
    effectiveDueDate: dateStr,
  };
}

export function refreshEmiStatuses(
  dueDate: string,
  status: "pending" | "paid" | "overdue" | "partial",
  today: string = toDateStr(new Date())
): "pending" | "paid" | "overdue" | "partial" {
  if (status === "paid" || status === "partial") return status;
  if (dueDate < today) return "overdue";
  return "pending";
}

export function formatDisplayDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy");
}
