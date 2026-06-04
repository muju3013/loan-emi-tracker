import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../hooks/useAppStore";
import { LoanForm } from "../components/LoanForm";

export function EditLoanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLoan, editLoan } = useAppStore();
  const loan = id ? getLoan(id) : undefined;

  if (!loan) {
    return <p className="text-slate-500">Loan not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to={`/loans/${loan.id}`} className="text-sm text-brand-600 hover:underline">
        ← Back to loan
      </Link>
      <h1 className="text-2xl font-bold">Edit Loan</h1>
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Editing recalculates unpaid EMIs. Already paid installments are kept.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <LoanForm
          initial={loan}
          onSubmit={async (input) => {
            await editLoan(loan.id, input);
            navigate(`/loans/${loan.id}`);
          }}
          onCancel={() => navigate(`/loans/${loan.id}`)}
        />
      </div>
    </div>
  );
}
