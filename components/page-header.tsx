import type { TaskStats } from '@/lib/stats/compute-stats';
import { PageMeta } from '@/components/page-meta';

type PageHeaderProps = {
  todayIso: string;
  stats: TaskStats;
};

export function PageHeader({ todayIso, stats }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h2 className="page-header__title">WBS</h2>
      <PageMeta
        todayIso={todayIso}
        total={stats.total}
        overdueCount={stats.overdueCount}
      />
    </div>
  );
}
