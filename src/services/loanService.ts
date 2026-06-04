import { buildAmortization, calculateEmi } from "../utils/emiCalculator";
import { resolveDueDate, refreshEmiStatuses } from "../utils/dueDateEngine";
import { generateId } from "../utils/format";
import type { AppData, EmiInstallment, Loan } from "../types";

export interface LoanInput {
  loanName: string;
  principalAmount: number;
  annualInterestRate: number;
  loanStartDate: string;
  tenureMonths: number;
}

function syncOverdueStatuses(emiSchedule: EmiInstallment[]): EmiInstallment[] {
  return emiSchedule.map((e) => ({
    ...e,
    status: refreshEmiStatuses(e.scheduledDueDate, e.status),
  }));
}

function generateSchedule(loan: Loan): EmiInstallment[] {
  const amort = buildAmortization(
    loan.principalAmount,
    loan.annualInterestRate,
    loan.tenureMonths,
    loan.emiAmount
  );

  return amort.map((row) => {
    const due = resolveDueDate(loan.loanStartDate, row.installmentNumber);

    return {
      id: generateId(),
      loanId: loan.id,
      installmentNumber: row.installmentNumber,
      scheduledDueDate: due.scheduledDueDate,
      effectiveDueDate: due.effectiveDueDate,
      adjustmentReason: "none",
      adjustmentNote: null,
      emiAmount: row.emiAmount,
      principalComponent: row.principalComponent,
      interestComponent: row.interestComponent,
      openingBalance: row.openingBalance,
      closingBalance: row.closingBalance,
      status: "pending" as const,
      amountPaid: 0,
      paymentDate: null,
    };
  });
}

export function createLoan(data: AppData, input: LoanInput): AppData {
  const summary = calculateEmi(
    input.principalAmount,
    input.annualInterestRate,
    input.tenureMonths
  );

  const loan: Loan = {
    id: generateId(),
    loanName: input.loanName.trim(),
    principalAmount: input.principalAmount,
    annualInterestRate: input.annualInterestRate,
    loanStartDate: input.loanStartDate,
    tenureMonths: input.tenureMonths,
    emiAmount: summary.emiAmount,
    totalInterest: summary.totalInterest,
    totalPayable: summary.totalPayable,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const schedule = generateSchedule(loan);

  return {
    ...data,
    loans: [...data.loans, loan],
    emiSchedule: syncOverdueStatuses([...data.emiSchedule, ...schedule]),
  };
}

export function updateLoan(
  data: AppData,
  loanId: string,
  input: LoanInput
): AppData {
  const existing = data.loans.find((l) => l.id === loanId);
  if (!existing) return data;

  const paidEmis = data.emiSchedule.filter(
    (e) => e.loanId === loanId && e.status === "paid"
  );

  const summary = calculateEmi(
    input.principalAmount,
    input.annualInterestRate,
    input.tenureMonths
  );

  const loan: Loan = {
    ...existing,
    loanName: input.loanName.trim(),
    principalAmount: input.principalAmount,
    annualInterestRate: input.annualInterestRate,
    loanStartDate: input.loanStartDate,
    tenureMonths: input.tenureMonths,
    emiAmount: summary.emiAmount,
    totalInterest: summary.totalInterest,
    totalPayable: summary.totalPayable,
  };

  const newSchedule = generateSchedule(loan);
  const startFrom = paidEmis.length + 1;
  const regenerated = newSchedule.filter((e) => e.installmentNumber >= startFrom);

  const otherEmis = data.emiSchedule.filter((e) => e.loanId !== loanId);
  const keptPaid = paidEmis;

  return {
    ...data,
    loans: data.loans.map((l) => (l.id === loanId ? loan : l)),
    emiSchedule: syncOverdueStatuses([...otherEmis, ...keptPaid, ...regenerated]),
  };
}

export function deleteLoan(data: AppData, loanId: string): AppData {
  return {
    ...data,
    loans: data.loans.filter((l) => l.id !== loanId),
    emiSchedule: data.emiSchedule.filter((e) => e.loanId !== loanId),
  };
}

export function markEmiPaid(
  data: AppData,
  emiId: string,
  paymentDate: string,
  amount?: number
): AppData {
  return {
    ...data,
    emiSchedule: syncOverdueStatuses(
      data.emiSchedule.map((e) => {
        if (e.id !== emiId) return e;
        const paid = amount ?? e.emiAmount;
        const isPartial = paid < e.emiAmount;
        return {
          ...e,
          status: isPartial ? "partial" : "paid",
          amountPaid: paid,
          paymentDate,
        };
      })
    ),
  };
}

export function markEmiPending(data: AppData, emiId: string): AppData {
  return {
    ...data,
    emiSchedule: syncOverdueStatuses(
      data.emiSchedule.map((e) =>
        e.id === emiId
          ? { ...e, status: "pending" as const, amountPaid: 0, paymentDate: null }
          : e
      )
    ),
  };
}

export function recalculateFutureEmis(data: AppData): AppData {
  const updated: EmiInstallment[] = [];

  for (const loan of data.loans.filter((l) => l.isActive)) {
    const loanEmis = data.emiSchedule
      .filter((e) => e.loanId === loan.id)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    for (const emi of loanEmis) {
      if (emi.status === "paid" || emi.status === "partial") {
        updated.push(emi);
        continue;
      }

      const due = resolveDueDate(loan.loanStartDate, emi.installmentNumber);

      updated.push({
        ...emi,
        scheduledDueDate: due.scheduledDueDate,
        effectiveDueDate: due.effectiveDueDate,
        adjustmentReason: "none",
        adjustmentNote: null,
      });
    }
  }

  const orphan = data.emiSchedule.filter(
    (e) => !data.loans.some((l) => l.id === e.loanId)
  );

  return {
    ...data,
    emiSchedule: syncOverdueStatuses([...updated, ...orphan]),
  };
}

export function addHoliday(
  data: AppData,
  holidayDate: string,
  name: string
): AppData {
  if (data.holidays.some((h) => h.holidayDate === holidayDate)) {
    return data;
  }
  return {
    ...data,
    holidays: [
      ...data.holidays,
      { id: generateId(), holidayDate, name: name.trim() },
    ].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate)),
  };
}

export function removeHoliday(data: AppData, id: string): AppData {
  return {
    ...data,
    holidays: data.holidays.filter((h) => h.id !== id),
  };
}
