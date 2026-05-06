import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageMeta } from '@/components/page-meta';

// SPEC §9 I-2 (메타 한 줄) / I-5 (overdue 0 일 때 "n개 지남" 토큰 미노출).
// e2e J18 은 공유 DB 한계로 "0개 작업" 단정을 못 박았다 — 이 단위 테스트가
// 그 갭(특히 .page-meta__overdue 노드 유무)을 결정론적으로 보장한다.
describe('PageMeta — SPEC §9 I-2 / I-5 분기', () => {
  it('overdueCount=0 일 때 .page-meta__overdue 노드를 렌더하지 않는다 (I-5)', () => {
    const { container } = render(
      <PageMeta todayIso="2026-05-04" total={0} overdueCount={0} />,
    );
    expect(container.querySelector('.page-meta__overdue')).toBeNull();
    expect(screen.getByText(/오늘 2026-05-04/)).toBeInTheDocument();
    expect(screen.getByText(/0개 작업/)).toBeInTheDocument();
  });

  it('overdueCount>0 일 때 .page-meta__overdue 에 "n개 지남" 텍스트가 들어간다 (I-2)', () => {
    const { container } = render(
      <PageMeta todayIso="2026-05-04" total={5} overdueCount={2} />,
    );
    const overdue = container.querySelector('.page-meta__overdue');
    expect(overdue).not.toBeNull();
    expect(overdue?.textContent).toContain('2개 지남');
    expect(screen.getByText(/5개 작업/)).toBeInTheDocument();
  });
});
