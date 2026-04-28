export type BarRange = {
  rangeStart: string;
  dayWidth: number;
};

export type BarTask = {
  startDate: string | null;
  dueDate: string | null;
};

export type BarStyle = {
  leftPx: number;
  widthPx: number;
};

const MS_PER_DAY = 86400000;
const MIN_BAR_WIDTH_PX = 12;
const BAR_GAP_PX = 2;

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function computeBarStyle(range: BarRange, task: BarTask): BarStyle | null {
  if (!task.startDate || !task.dueDate) return null;
  const rangeStart = parseIsoDate(range.rangeStart);
  const start = parseIsoDate(task.startDate);
  const end = parseIsoDate(task.dueDate);
  const leftPx = daysBetween(rangeStart, start) * range.dayWidth;
  const inclusiveDays = daysBetween(start, end) + 1;
  const widthPx = Math.max(inclusiveDays * range.dayWidth - BAR_GAP_PX, MIN_BAR_WIDTH_PX);
  return { leftPx, widthPx };
}
