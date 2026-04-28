export type GridMonth = {
  key: string;
  label: string;
  weeks: number;
};

export type GridRange = {
  start: Date;
  end: Date;
  weeks: Date[];
  months: GridMonth[];
  totalDays: number;
  rangeStartIso: string;
};

const MS_PER_DAY = 86400000;

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekUTC(d: Date): Date {
  const result = new Date(d.getTime());
  const dow = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - dow);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function todayUTC(today: Date): Date {
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

export function computeGridRange(
  tasks: { startDate: string | null; dueDate: string | null }[],
  today: Date
): GridRange {
  const dates: Date[] = [];
  for (const t of tasks) {
    if (t.startDate) dates.push(parseIsoDate(t.startDate));
    if (t.dueDate) dates.push(parseIsoDate(t.dueDate));
  }
  const todayMidnight = todayUTC(today);

  let start: Date;
  let end: Date;

  if (dates.length === 0) {
    const a = new Date(todayMidnight.getTime());
    a.setUTCDate(a.getUTCDate() - 14);
    const b = new Date(todayMidnight.getTime());
    b.setUTCDate(b.getUTCDate() + 28);
    start = startOfWeekUTC(a);
    end = startOfWeekUTC(b);
  } else {
    dates.push(todayMidnight);
    let min = dates[0];
    let max = dates[0];
    for (const d of dates) {
      if (d.getTime() < min.getTime()) min = d;
      if (d.getTime() > max.getTime()) max = d;
    }
    start = startOfWeekUTC(min);
    start.setUTCDate(start.getUTCDate() - 7);
    end = startOfWeekUTC(max);
    end.setUTCDate(end.getUTCDate() + 14);
  }

  const weeks: Date[] = [];
  for (
    let d = new Date(start.getTime());
    d.getTime() < end.getTime();
    d.setUTCDate(d.getUTCDate() + 7)
  ) {
    weeks.push(new Date(d.getTime()));
  }

  const months: GridMonth[] = [];
  for (const w of weeks) {
    const key = `${w.getUTCFullYear()}-${w.getUTCMonth()}`;
    const last = months[months.length - 1];
    if (!last || last.key !== key) {
      months.push({ key, label: `${w.getUTCFullYear()}년 ${w.getUTCMonth() + 1}월`, weeks: 1 });
    } else {
      last.weeks += 1;
    }
  }

  const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);

  return { start, end, weeks, months, totalDays, rangeStartIso: toIsoDate(start) };
}

export function todayOffsetDays(rangeStart: Date, today: Date): number {
  const t = todayUTC(today);
  return Math.round((t.getTime() - rangeStart.getTime()) / MS_PER_DAY);
}
