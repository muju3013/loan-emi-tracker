import type { LoanInput } from "../services/loanService";

export const SAMPLE_LOAN: LoanInput = {
  loanName: "Home Loan",
  principalAmount: 2500000,
  annualInterestRate: 8.5,
  loanStartDate: "2026-01-26",
  tenureMonths: 24,
};
