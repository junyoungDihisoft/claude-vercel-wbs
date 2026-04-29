'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { TaskNode } from '@/lib/tree/build-task-tree';
import { computeGridRange, todayOffsetDays } from '@/lib/gantt/grid-range';
import { computeBarStyle } from '@/lib/gantt/compute-bar-style';
import { isOverdue } from '@/lib/tasks/is-overdue';

const WEEK_WIDTH_PX = 96;
const DAY_WIDTH_PX = WEEK_WIDTH_PX / 7;

interface GanttBoardProps {
  nodes: TaskNode[];
  todayIso: string;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isSameWeek(d: Date, weekStart: Date): boolean {
  const weekEnd = new Date(weekStart.getTime());
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  return d.getTime() >= weekStart.getTime() && d.getTime() < weekEnd.getTime();
}

export function GanttBoard({ nodes, todayIso }: GanttBoardProps) {
  const today = useMemo(() => parseIsoDate(todayIso), [todayIso]);
  const tasksForRange = useMemo(
    () => nodes.map((n) => ({ startDate: n.task.startDate, dueDate: n.task.dueDate })),
    [nodes]
  );
  const range = useMemo(() => computeGridRange(tasksForRange, today), [tasksForRange, today]);

  const childCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of nodes) {
      const pid = n.task.parentId;
      if (pid) m[pid] = (m[pid] ?? 0) + 1;
    }
    return m;
  }, [nodes]);

  const todayLeftPx = todayOffsetDays(range.start, today) * DAY_WIDTH_PX;
  const todayInRange = today.getTime() >= range.start.getTime() && today.getTime() < range.end.getTime();

  const cssVars = {
    '--week-count': range.weeks.length,
    '--week-w': `${WEEK_WIDTH_PX}px`,
  } as CSSProperties;

  if (!nodes.length) {
    return (
      <div style={{ padding: '40px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>
        간트 뷰가 비어 있습니다. 목록 뷰에서 작업을 추가하세요.
      </div>
    );
  }

  return (
    <div className="gantt" style={cssVars}>
      <div className="gantt-left">
        <div className="gantt-left-head">
          <div>작업</div>
          <div style={{ textAlign: 'right' }}>진행률</div>
        </div>
        <div className="gantt-left-spacer" />
        {nodes.map((n) => {
          const isDone = n.task.status === 'done';
          const hasDates = !!(n.task.startDate && n.task.dueDate);
          return (
            <div key={n.task.id} className={`gantt-row-left ${isDone ? 'is-done' : ''}`}>
              <div className="title-cell" style={{ paddingLeft: n.depth * 16 }}>
                <span className="label">{n.task.title}</span>
                {n.hasChildren && (
                  <span className="row-children-count">{childCounts[n.task.id] ?? 0}</span>
                )}
              </div>
              <div className="pct">
                {hasDates ? `${n.task.progress}%` : <span className="empty">미정</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="gantt-right">
        <div style={{ minWidth: '100%' }}>
          <div className="gantt-month-row">
            {range.months.map((m) => (
              <div key={m.key} className="gantt-month" style={{ width: m.weeks * WEEK_WIDTH_PX }}>
                {m.label}
              </div>
            ))}
          </div>
          <div className="gantt-week-row">
            {range.weeks.map((w, i) => (
              <div
                key={i}
                className={`gantt-week ${isSameWeek(today, w) ? 'is-current' : ''}`}
              >
                {w.getUTCMonth() + 1}/{w.getUTCDate()}
              </div>
            ))}
          </div>
          <div className="gantt-body">
            {todayInRange && <div className="gantt-today" style={{ left: todayLeftPx }} />}
            {nodes.map((n) => {
              const bar = computeBarStyle(
                { rangeStart: range.rangeStartIso, dayWidth: DAY_WIDTH_PX },
                { startDate: n.task.startDate, dueDate: n.task.dueDate }
              );
              const isDone = n.task.status === 'done';
              const overdue = isOverdue(n.task, todayIso);
              return (
                <div className="gantt-grid-row" key={n.task.id}>
                  {range.weeks.map((w, i) => (
                    <div
                      key={i}
                      className={`gantt-grid-cell ${isSameWeek(today, w) ? 'is-current-week' : ''}`}
                    />
                  ))}
                  {bar ? (
                    <div
                      className={`gantt-bar ${isDone ? 'is-done' : ''} ${overdue ? 'overdue' : ''}`}
                      style={{ left: bar.leftPx, width: bar.widthPx }}
                    >
                      <div className="gantt-bar-fill" style={{ width: `${n.task.progress}%` }} />
                      <span className="gantt-bar-label">{n.task.progress}%</span>
                    </div>
                  ) : (
                    <div className="gantt-empty-bar">— 일정 없음 —</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
