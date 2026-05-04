import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf8'),
) as { devDependencies?: Record<string, string> };

function parseMajorMinor(raw: string): { major: number; minor: number } {
  const m = raw.match(/^[~^]?(\d+)\.(\d+)\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/);
  expect(m, `unsupported version specifier (caret/tilde + x.y.z only): ${raw}`).not.toBeNull();
  return { major: Number(m![1]), minor: Number(m![2]) };
}

describe('package.json dev-deps version contract (Issue #17)', () => {
  it('vitest is on major 3', () => {
    const { major } = parseMajorMinor(pkg.devDependencies?.['vitest'] ?? '');
    expect(major).toBe(3);
  });

  it('@types/node is on major 20', () => {
    const { major } = parseMajorMinor(pkg.devDependencies?.['@types/node'] ?? '');
    expect(major).toBe(20);
  });

  it('eslint-config-next is on major 15 (matches next major)', () => {
    const { major } = parseMajorMinor(pkg.devDependencies?.['eslint-config-next'] ?? '');
    expect(major).toBe(15);
  });

  it('@vitejs/plugin-react is on major 4 (paired with vitest 3 bundled vite)', () => {
    const { major } = parseMajorMinor(pkg.devDependencies?.['@vitejs/plugin-react'] ?? '');
    expect(major).toBe(4);
  });

  it('drizzle-kit is 0.31.x or newer (or any 1.x+)', () => {
    const { major, minor } = parseMajorMinor(pkg.devDependencies?.['drizzle-kit'] ?? '');
    if (major === 0) {
      expect(minor).toBeGreaterThanOrEqual(31);
    } else {
      expect(major).toBeGreaterThanOrEqual(1);
    }
  });
});
