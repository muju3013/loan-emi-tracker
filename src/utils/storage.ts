import { DEFAULT_HOLIDAYS_2026 } from "../data/defaultHolidays";
import type { AppData, EmiInstallment } from "../types";

const LEGACY_KEY = "loan-emi-tracker-demo";

function dataKey(userId: string): string {
  return `loan-emi-tracker-data-${userId}`;
}

function normalizeEmi(emi: EmiInstallment): EmiInstallment {
  return {
    ...emi,
    effectiveDueDate: emi.scheduledDueDate,
    adjustmentReason: "none",
    adjustmentNote: null,
  };
}

function emptyAppData(): AppData {
  return { loans: [], emiSchedule: [], holidays: [...DEFAULT_HOLIDAYS_2026] };
}

export function initUserAppData(userId: string): AppData {
  const fresh = emptyAppData();
  saveAppData(userId, fresh);
  return fresh;
}

export function loadAppData(userId: string): AppData {
  try {
    const raw = localStorage.getItem(dataKey(userId));
    if (!raw) {
      const migrated = migrateLegacyData(userId);
      if (migrated) return migrated;
      return emptyAppData();
    }
    const parsed = JSON.parse(raw) as AppData;
    return {
      loans: parsed.loans ?? [],
      emiSchedule: (parsed.emiSchedule ?? []).map(normalizeEmi),
      holidays:
        parsed.holidays?.length > 0 ? parsed.holidays : [...DEFAULT_HOLIDAYS_2026],
    };
  } catch {
    return emptyAppData();
  }
}

/** One-time: attach old browser data to first signed-in user */
function migrateLegacyData(userId: string): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppData;
    const data: AppData = {
      loans: parsed.loans ?? [],
      emiSchedule: (parsed.emiSchedule ?? []).map(normalizeEmi),
      holidays:
        parsed.holidays?.length > 0 ? parsed.holidays : [...DEFAULT_HOLIDAYS_2026],
    };
    saveAppData(userId, data);
    localStorage.removeItem(LEGACY_KEY);
    return data;
  } catch {
    return null;
  }
}

export function saveAppData(userId: string, data: AppData): void {
  localStorage.setItem(dataKey(userId), JSON.stringify(data));
}

export function resetDemoData(userId: string): AppData {
  const fresh = emptyAppData();
  saveAppData(userId, fresh);
  return fresh;
}
