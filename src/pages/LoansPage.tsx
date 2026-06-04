import { Link } from "react-router-dom";
import { ChevronRight, PlusCircle } from "lucide-react";
import { useAppStore } from "../hooks/useAppStore";
import { formatCurrency, formatCurrencyExact } from "../utils/format";

export function LoansPage() {
  const { loans, getLoanStats } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Loans</h1>
        <Link
          to="/loans/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
        >
          <PlusCircle className="w-4 h-4" />
          Add Loan
        </Link>
      </div>

      {loans.length === 0 ? (
        <p className="text-slate-500">No active loans.</p>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => {
            const stats = getLoanStats(loan.id);
            const progress = Math.round((stats.paidCount / loan.tenureMonths) * 100);

            return (
              <Link
                key={loan.id}
                to={`/loans/${loan.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg">{loan.loanName}</h2>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Principal</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(loan.principalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">EMI</p>
                    <p className="font-medium tabular-nums">
                      {formatCurrencyExact(loan.emiAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Remaining</p>
                    <p className="font-medium tabular-nums text-violet-700">
                      {formatCurrency(stats.remainingPrincipal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Paid</p>
                    <p className="font-medium tabular-nums text-emerald-700">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>
                      {stats.paidCount} / {loan.tenureMonths} EMIs paid
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
