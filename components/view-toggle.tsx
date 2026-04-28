'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ViewToggle() {
  const pathname = usePathname();
  const isList = pathname === '/';
  const isGantt = pathname.startsWith('/gantt');
  return (
    <nav className="view-toggle" aria-label="뷰 전환">
      <Link href="/" className={isList ? 'active' : undefined}>
        목록
      </Link>
      <Link href="/gantt" className={isGantt ? 'active' : undefined}>
        간트
      </Link>
    </nav>
  );
}
