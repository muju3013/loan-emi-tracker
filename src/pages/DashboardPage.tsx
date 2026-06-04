import { Link } from "react-router-dom";
import { PlusCircle, Sparkles } from "lucide-react";
import { useAppStore } from "../hooks/useAppStore";
import { SAMPLE_LOAN } from "../data/sampleLoan";
import { SummaryCards } from "../components/SummaryCards";
import { UpcomingReminders } from "../components/UpcomingReminders";
import { formatCurrency } from "../utils/format";

export function DashboardPage() {
  const { dashboard, loans, resetDemo, addLoan } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track loans and monthly EMIs
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/loans/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
          >
            <PlusCircle className="w-4 h-4" />
            Add Loan
          </Link>
          {loans.length === 0 && (
            <button
              type="button"
              onClick={() => void addLoan(SAMPLE_LOAN)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50"
            >
              <Sparkles className="w-4 h-4" />
              Load Sample Loan
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all loans and reset holidays?")) void resetDemo();
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50"
          >
            Reset Demo
          </button>
        </div>
      </div>

      <SummaryCards
        activeLoans={dashboard.activeLoansCount}
        totalDebt={dashboard.totalDebt}
        thisMonthEmi={dashboard.thisMonthEmiDue}
        overdueCount={dashboard.overdueCount}
      />

      {loans.length > 0 && (
        <p className="text-sm text-slate-600">
          Total paid across all loans:{" "}
          <span className="font-semibold tabular-nums">
            {formatCurrency(dashboard.totalPaidAllLoans)}
          </span>
        </p>
      )}

      <UpcomingReminders />

      {loans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-slate-600 mb-4">No loans yet. Try adding a sample home loan.</p>
          <Link
            to="/loans/new"
            className="text-brand-600 font-medium hover:underline"
          >
            Create your first loan →
          </Link>
        </div>
      )}
    </div>
  );
}
