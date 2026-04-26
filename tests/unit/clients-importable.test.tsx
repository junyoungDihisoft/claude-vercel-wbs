import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
] as const;

function clearEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

describe('Issue #1 bootstrap — 네 클라이언트 import 가능 + Providers 동작', () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
  });

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

  it('drizzle.config 는 CLAUDE.md §6 규약 필드를 그대로 노출한다', async () => {
    const mod = await import('@/drizzle.config');
    const config = mod.default as Record<string, unknown>;
    expect(config.dialect).toBe('postgresql');
    expect(config.schema).toBe('./lib/db/schema.ts');
    expect(config.out).toBe('./drizzle');
    expect(config.strict).toBe(true);
    expect(config.verbose).toBe(true);
  });

  it('createSupabaseBrowserClient 는 NEXT_PUBLIC_SUPABASE_URL 미설정 시 명시 에러를 던진다', async () => {
    const mod = await import('@/lib/supabase/client');
    expect(() => mod.createSupabaseBrowserClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it('createSupabaseServerClient 는 NEXT_PUBLIC_SUPABASE_URL 미설정 시 명시 에러를 던진다', async () => {
    const mod = await import('@/lib/supabase/server');
    await expect(mod.createSupabaseServerClient()).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it('getDb 는 DATABASE_URL 미설정 시 generic 에러를 던지고 .env.local 같은 로컬 파일 경로를 메시지에 노출하지 않는다', async () => {
    const mod = await import('@/lib/db');
    expect(() => mod.getDb()).toThrow(/DATABASE_URL/);
    try {
      mod.getDb();
    } catch (e) {
      expect(String(e)).not.toMatch(/\.env\.local/);
    }
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
