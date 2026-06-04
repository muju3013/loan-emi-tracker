export interface EmiSummary {
  emiAmount: number;
  totalPayable: number;
  totalInterest: number;
}

export function calculateEmi(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number
): EmiSummary {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emiAmount: 0, totalPayable: 0, totalInterest: 0 };
  }

  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    const emiAmount = principal / tenureMonths;
    return {
      emiAmount: round2(emiAmount),
      totalPayable: round2(principal),
      totalInterest: 0,
    };
  }

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emiAmount = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayable = emiAmount * tenureMonths;
  const totalInterest = totalPayable - principal;

  return {
    emiAmount: round2(emiAmount),
    totalPayable: round2(totalPayable),
    totalInterest: round2(totalInterest),
  };
}

export interface AmortizationRow {
  installmentNumber: number;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  openingBalance: number;
  closingBalance: number;
}

export function buildAmortization(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
  emiAmount: number
): AmortizationRow[] {
  const monthlyRate = annualRatePercent / 12 / 100;
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const openingBalance = balance;
    const interestComponent =
      monthlyRate === 0 ? 0 : round2(openingBalance * monthlyRate);
    let principalComponent = round2(emiAmount - interestComponent);

    if (i === tenureMonths) {
      principalComponent = round2(openingBalance);
    }

    const actualEmi = round2(principalComponent + interestComponent);
    const closingBalance = round2(Math.max(0, openingBalance - principalComponent));

    rows.push({
      installmentNumber: i,
      emiAmount: actualEmi,
      principalComponent,
      interestComponent,
      openingBalance: round2(openingBalance),
      closingBalance,
    });

    balance = closingBalance;
  }

  return rows;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
