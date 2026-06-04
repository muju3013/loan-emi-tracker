import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  addHoliday,
  createLoan,
  deleteLoan,
  markEmiPaid,
  markEmiPending,
  recalculateFutureEmis,
  removeHoliday,
  updateLoan,
  type LoanInput,
} from "../services/loanService";
import {
  subscribeToUserData,
  syncLoanChange,
  resetUserData,
} from "../services/firestoreService";
import { useAuth } from "./useAuth";
import { pickUpcomingEmisPerLoan } from "../utils/nextReminder";
import type { AppData, EmiInstallment, Loan } from "../types";
import { DEFAULT_HOLIDAYS_2026 } from "../data/defaultHolidays";

interface DashboardStats {
  activeLoansCount: number;
  totalDebt: number;
  totalOutstanding: number;
  thisMonthEmiDue: number;
  totalPaidAllLoans: number;
  overdueCount: number;
}

interface AppStoreValue {
  data: AppData;
  loans: Loan[];
  dataLoading: boolean;
  syncError: string | null;
  addLoan: (input: LoanInput) => Promise<void>;
  editLoan: (id: string, input: LoanInput) => Promise<void>;
  removeLoan: (id: string) => Promise<void>;
  payEmi: (emiId: string, paymentDate: string) => Promise<void>;
  unpayEmi: (emiId: string) => Promise<void>;
  addHoliday: (date: string, name: string) => Promise<void>;
  removeHoliday: (id: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  getLoanEmis: (loanId: string) => EmiInstallment[];
  getLoan: (loanId: string) => Loan | undefined;
  upcomingEmis: EmiInstallment[];
  dashboard: DashboardStats;
  getLoanStats: (loanId: string) => {
    totalPaid: number;
    remainingPrincipal: number;
    paidCount: number;
  };
}

const AppContext = createContext<AppStoreValue | null>(null);

const emptyData = (): AppData => ({
  loans: [],
  emiSchedule: [],
  holidays: [...DEFAULT_HOLIDAYS_2026],
});

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user!.id;

  const [data, setData] = useState<AppData>(emptyData);
  const [dataLoading, setDataLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setDataLoading(true);
    setSyncError(null);

    const unsub = subscribeToUserData(
      userId,
      (remote) => {
        setData(recalculateFutureEmis(remote));
        setDataLoading(false);
      },
      (err) => {
        setSyncError(err.message);
        setDataLoading(false);
      }
    );

    return unsub;
  }, [userId]);

  const persist = useCallback(
    async (next: AppData, loanId?: string) => {
      const prev = dataRef.current;
      try {
        setSyncError(null);
        await syncLoanChange(userId, prev, next, loanId);
      } catch (e) {
        setSyncError((e as Error).message);
        throw e;
      }
    },
    [userId]
  );

  const applyAndPersist = useCallback(
    async (updater: (d: AppData) => AppData, loanId?: string) => {
      const prev = dataRef.current;
      const next = recalculateFutureEmis(updater(prev));
      setData(next);
      await persist(next, loanId);
    },
    [persist]
  );

  const loans = useMemo(
    () => data.loans.filter((l) => l.isActive),
    [data.loans]
  );

  const getLoanEmis = useCallback(
    (loanId: string) =>
      data.emiSchedule
        .filter((e) => e.loanId === loanId)
        .sort((a, b) => a.installmentNumber - b.installmentNumber),
    [data.emiSchedule]
  );

  const getLoan = useCallback(
    (loanId: string) => data.loans.find((l) => l.id === loanId),
    [data.loans]
  );

  const upcomingEmis = useMemo(
    () => pickUpcomingEmisPerLoan(data.emiSchedule, loans.map((l) => l.id)),
    [data.emiSchedule, loans]
  );

  const dashboard = useMemo((): DashboardStats => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    let totalDebt = 0;
    let totalPaidAllLoans = 0;
    let overdueCount = 0;

    for (const loan of loans) {
      const emis = data.emiSchedule.filter((e) => e.loanId === loan.id);
      const unpaid = emis.find((e) => e.status === "pending" || e.status === "overdue");
      totalDebt += unpaid?.openingBalance ?? 0;
      totalPaidAllLoans += emis.reduce((s, e) => s + e.amountPaid, 0);
      overdueCount += emis.filter((e) => e.status === "overdue").length;
    }

    const thisMonthEmiDue = data.emiSchedule
      .filter((e) => {
        if (e.status === "paid") return false;
        const d = parseISO(e.scheduledDueDate);
        return isWithinInterval(d, {
          start: parseISO(monthStart),
          end: parseISO(monthEnd),
        });
      })
      .reduce((s, e) => s + e.emiAmount - e.amountPaid, 0);

    return {
      activeLoansCount: loans.length,
      totalDebt,
      totalOutstanding: totalDebt,
      thisMonthEmiDue,
      totalPaidAllLoans,
      overdueCount,
    };
  }, [loans, data.emiSchedule]);

  const getLoanStats = useCallback(
    (loanId: string) => {
      const emis = getLoanEmis(loanId);
      const totalPaid = emis.reduce((s, e) => s + e.amountPaid, 0);
      const unpaid = emis.find((e) => e.status === "pending" || e.status === "overdue");
      const paidCount = emis.filter((e) => e.status === "paid").length;
      return {
        totalPaid,
        remainingPrincipal: unpaid?.openingBalance ?? 0,
        paidCount,
      };
    },
    [getLoanEmis]
  );

  const value: AppStoreValue = {
    data,
    loans,
    dataLoading,
    syncError,
    addLoan: (input) => applyAndPersist((d) => createLoan(d, input)),
    editLoan: (id, input) => applyAndPersist((d) => updateLoan(d, id, input), id),
    removeLoan: async (id) => {
      const prev = dataRef.current;
      const next = deleteLoan(prev, id);
      setData(next);
      await persist(next, id);
    },
    payEmi: (emiId, paymentDate) =>
      applyAndPersist((d) => markEmiPaid(d, emiId, paymentDate)),
    unpayEmi: (emiId) => applyAndPersist((d) => markEmiPending(d, emiId)),
    addHoliday: (date, name) => applyAndPersist((d) => addHoliday(d, date, name)),
    removeHoliday: (id) => applyAndPersist((d) => removeHoliday(d, id)),
    resetDemo: async () => {
      const fresh = await resetUserData(userId);
      setData(recalculateFutureEmis(fresh));
    },
    getLoanEmis,
    getLoan,
    upcomingEmis,
    dashboard,
    getLoanStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
