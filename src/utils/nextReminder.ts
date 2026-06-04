import { endOfMonth, format, startOfMonth } from "date-fns";
import type { EmiInstallment } from "../types";

function isUnpaid(emi: EmiInstallment): boolean {
  return emi.status === "pending" || emi.status === "overdue" || emi.status === "partial";
}

/** Next unpaid EMI per loan: this month first, then earliest unpaid after paid. */
export function pickUpcomingEmisPerLoan(
  emis: EmiInstallment[],
  activeLoanIds: string[]
): EmiInstallment[] {
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const results: EmiInstallment[] = [];

  for (const loanId of activeLoanIds) {
    const loanUnpaid = emis
      .filter((e) => e.loanId === loanId && isUnpaid(e))
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    if (loanUnpaid.length === 0) continue;

    const thisMonth = loanUnpaid.filter(
      (e) => e.scheduledDueDate >= monthStart && e.scheduledDueDate <= monthEnd
    );

    results.push(thisMonth.length > 0 ? thisMonth[0] : loanUnpaid[0]);
  }

  return results.sort((a, b) => a.scheduledDueDate.localeCompare(b.scheduledDueDate));
}
