import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_HOLIDAYS_2026 } from "../data/defaultHolidays";
import type { AppData, EmiInstallment, Holiday, Loan } from "../types";

function loansCol(userId: string) {
  return collection(db, "users", userId, "loans");
}

function emisCol(userId: string) {
  return collection(db, "users", userId, "emis");
}

function settingsDoc(userId: string) {
  return doc(db, "users", userId, "settings", "app");
}

function emptyData(): AppData {
  return { loans: [], emiSchedule: [], holidays: [...DEFAULT_HOLIDAYS_2026] };
}

function normalizeEmi(emi: EmiInstallment): EmiInstallment {
  return {
    ...emi,
    effectiveDueDate: emi.scheduledDueDate,
    adjustmentReason: "none",
    adjustmentNote: null,
  };
}

/** Real-time listener — only this user's data */
export function subscribeToUserData(
  userId: string,
  onData: (data: AppData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let loans: Loan[] = [];
  let emiSchedule: EmiInstallment[] = [];
  let holidays: Holiday[] = [...DEFAULT_HOLIDAYS_2026];
  let loansReady = false;
  let emisReady = false;
  let settingsReady = false;

  const emit = () => {
    if (loansReady && emisReady && settingsReady) {
      onData({ loans, emiSchedule, holidays });
    }
  };

  const unsubLoans = onSnapshot(
    loansCol(userId),
    (snap) => {
      loans = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Loan);
      loansReady = true;
      emit();
    },
    (err) => onError?.(err)
  );

  const unsubEmis = onSnapshot(
    emisCol(userId),
    (snap) => {
      emiSchedule = snap.docs.map((d) => normalizeEmi({ id: d.id, ...d.data() } as EmiInstallment));
      emisReady = true;
      emit();
    },
    (err) => onError?.(err)
  );

  const unsubSettings = onSnapshot(
    settingsDoc(userId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        holidays =
          Array.isArray(data.holidays) && data.holidays.length > 0
            ? (data.holidays as Holiday[])
            : [...DEFAULT_HOLIDAYS_2026];
      }
      settingsReady = true;
      emit();
    },
    (err) => onError?.(err)
  );

  return () => {
    unsubLoans();
    unsubEmis();
    unsubSettings();
  };
}

export async function ensureUserSettings(userId: string): Promise<void> {
  const ref = settingsDoc(userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { holidays: DEFAULT_HOLIDAYS_2026 });
  }
}

export async function saveLoan(userId: string, loan: Loan): Promise<void> {
  const { id, ...loanData } = loan;
  await setDoc(doc(db, "users", userId, "loans", id), loanData);
}

export async function deleteLoanFromFirestore(
  userId: string,
  loanId: string
): Promise<void> {
  const emisQuery = query(emisCol(userId), where("loanId", "==", loanId));
  const emisSnap = await getDocs(emisQuery);
  const batch = writeBatch(db);
  emisSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "users", userId, "loans", loanId));
  await batch.commit();
}

export async function saveEmiInstallments(
  userId: string,
  emis: EmiInstallment[]
): Promise<void> {
  if (emis.length === 0) return;
  const batch = writeBatch(db);
  for (const emi of emis) {
    const { id, ...emiData } = emi;
    batch.set(doc(db, "users", userId, "emis", id), emiData);
  }
  await batch.commit();
}

export async function deleteEmisForLoan(
  userId: string,
  loanId: string
): Promise<void> {
  const emisQuery = query(emisCol(userId), where("loanId", "==", loanId));
  const snap = await getDocs(emisQuery);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function saveEmi(userId: string, emi: EmiInstallment): Promise<void> {
  const { id, ...emiData } = emi;
  await setDoc(doc(db, "users", userId, "emis", id), emiData);
}

export async function saveHolidays(userId: string, holidays: Holiday[]): Promise<void> {
  await setDoc(settingsDoc(userId), { holidays }, { merge: true });
}

export async function resetUserData(userId: string): Promise<AppData> {
  const loansSnap = await getDocs(loansCol(userId));
  const emisSnap = await getDocs(emisCol(userId));
  const batch = writeBatch(db);
  loansSnap.docs.forEach((d) => batch.delete(d.ref));
  emisSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await setDoc(settingsDoc(userId), { holidays: DEFAULT_HOLIDAYS_2026 });
  return emptyData();
}

/** Persist full app state after local mutations */
export async function syncAppDataToFirestore(userId: string, data: AppData): Promise<void> {
  const batch = writeBatch(db);

  for (const loan of data.loans) {
    const { id, ...loanData } = loan;
    batch.set(doc(db, "users", userId, "loans", id), loanData);
  }
  for (const emi of data.emiSchedule) {
    const { id, ...emiData } = emi;
    batch.set(doc(db, "users", userId, "emis", id), emiData);
  }

  await batch.commit();
  await saveHolidays(userId, data.holidays);
}

export async function syncLoanChange(
  userId: string,
  prev: AppData,
  next: AppData,
  loanId?: string
): Promise<void> {
  const prevLoanIds = new Set(prev.loans.map((l) => l.id));
  const nextLoanIds = new Set(next.loans.map((l) => l.id));

  for (const id of prevLoanIds) {
    if (!nextLoanIds.has(id)) {
      await deleteLoanFromFirestore(userId, id);
    }
  }

  const changedLoanIds = loanId
    ? [loanId]
    : next.loans.filter((l) => {
        const old = prev.loans.find((o) => o.id === l.id);
        return !old || JSON.stringify(old) !== JSON.stringify(l);
      }).map((l) => l.id);

  for (const id of changedLoanIds) {
    const loan = next.loans.find((l) => l.id === id);
    if (loan) await saveLoan(userId, loan);
  }

  const prevEmiIds = new Set(prev.emiSchedule.map((e) => e.id));
  const nextEmiIds = new Set(next.emiSchedule.map((e) => e.id));

  for (const id of prevEmiIds) {
    if (!nextEmiIds.has(id)) {
      await deleteDoc(doc(db, "users", userId, "emis", id));
    }
  }

  const changedEmis = next.emiSchedule.filter((e) => {
    const old = prev.emiSchedule.find((o) => o.id === e.id);
    return !old || JSON.stringify(old) !== JSON.stringify(e);
  });

  if (changedEmis.length > 0) {
    await saveEmiInstallments(userId, changedEmis);
  }

  if (JSON.stringify(prev.holidays) !== JSON.stringify(next.holidays)) {
    await saveHolidays(userId, next.holidays);
  }
}
