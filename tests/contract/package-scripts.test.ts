import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf8'),
) as { scripts?: Record<string, string> };

describe('package.json scripts contract (Issue #1)', () => {
  const required = [
    'db:generate',
    'db:migrate',
    'db:studio',
    'test',
    'test:e2e',
  ] as const;

  for (const name of required) {
    it(`exposes "${name}" script`, () => {
      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts?.[name]).toBeTruthy();
    });
  }
});
