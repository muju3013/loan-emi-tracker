import type { Holiday } from "../types";

function hid(date: string, name: string): Holiday {
  return { id: `h-${date}`, holidayDate: date, name };
}

export const DEFAULT_HOLIDAYS_2026: Holiday[] = [
  hid("2026-01-26", "Republic Day"),
  hid("2026-03-10", "Holi"),
  hid("2026-03-30", "Ugadi"),
  hid("2026-04-03", "Good Friday"),
  hid("2026-04-14", "Dr. Ambedkar Jayanti"),
  hid("2026-05-01", "May Day"),
  hid("2026-08-15", "Independence Day"),
  hid("2026-10-02", "Gandhi Jayanti"),
  hid("2026-10-20", "Dussehra"),
  hid("2026-11-08", "Diwali"),
  hid("2026-11-09", "Diwali (Balipratipada)"),
  hid("2026-12-25", "Christmas"),
];
