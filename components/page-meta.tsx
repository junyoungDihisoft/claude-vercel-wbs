type PageMetaProps = {
  todayIso: string;
  total: number;
  overdueCount: number;
};

export function PageMeta({ todayIso, total, overdueCount }: PageMetaProps) {
  return (
    <p className="page-meta">
      오늘 {todayIso}
      {' · '}
      {total}개 작업
      {overdueCount > 0 && (
        <>
          {' · '}
          <span className="page-meta__overdue">{overdueCount}개 지남</span>
        </>
      )}
    </p>
  );
}
