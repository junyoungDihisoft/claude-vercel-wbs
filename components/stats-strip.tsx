import type { TaskStats } from '@/lib/stats/compute-stats';

type StatsStripProps = {
  stats: TaskStats;
};

export function StatsStrip({ stats }: StatsStripProps) {
  const { total, doneCount, doingCount, overdueCount, donePercent } = stats;

  return (
    <div className="stats">
      <div className="stat">
        <div className="stat__label">전체</div>
        <div className="stat__value">{total}</div>
        <div className="stat__sub" />
      </div>
      <div className="stat">
        <div className="stat__label">완료</div>
        <div className="stat__value">
          {doneCount}/{total}
        </div>
        <div className="stat__sub">{donePercent}% 진척</div>
      </div>
      <div className="stat">
        <div className="stat__label">진행 중</div>
        <div className="stat__value">{doingCount}</div>
        <div className="stat__sub">활성</div>
      </div>
      <div className="stat">
        <div className="stat__label">지남</div>
        <div className="stat__value">{overdueCount}</div>
        <div className="stat__sub">주의 필요</div>
      </div>
    </div>
  );
}
