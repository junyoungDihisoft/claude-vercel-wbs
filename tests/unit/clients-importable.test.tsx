import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Issue #1 bootstrap — 네 클라이언트 import 가능 + Providers 동작', () => {
  it('lib/supabase/client 은 환경변수 없이 import 가능하고 팩토리를 export 한다', async () => {
    const mod = await import('@/lib/supabase/client');
    expect(typeof mod.createSupabaseBrowserClient).toBe('function');
  });

  it('lib/supabase/server 는 환경변수 없이 import 가능하고 팩토리를 export 한다', async () => {
    const mod = await import('@/lib/supabase/server');
    expect(typeof mod.createSupabaseServerClient).toBe('function');
  });

  it('lib/db 는 환경변수 없이 import 가능하다 (lazy getDb)', async () => {
    const mod = await import('@/lib/db');
    expect(typeof mod.getDb).toBe('function');
  });

  it('drizzle.config 는 환경변수 없이 import 가능하다', async () => {
    const mod = await import('@/drizzle.config');
    expect(mod.default).toBeTruthy();
  });

  it('Providers 하위에서 Chakra Heading 이 실제로 렌더된다', async () => {
    const { Providers } = await import('@/app/providers');
    const { Heading } = await import('@chakra-ui/react');
    render(
      <Providers>
        <Heading as="h1">WBS</Heading>
      </Providers>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'WBS' }),
    ).toBeInTheDocument();
  });
});
