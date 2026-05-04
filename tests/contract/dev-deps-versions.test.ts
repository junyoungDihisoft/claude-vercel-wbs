import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf8'),
) as { devDependencies?: Record<string, string> };

describe('package.json dev-deps version contract (Issue #17)', () => {
  it('vitest is on major 3', () => {
    const raw = pkg.devDependencies?.['vitest'] ?? '';
    const major = parseInt(raw.replace(/^\^|~/, '').split('.')[0], 10);
    expect(major).toBe(3);
  });

  it('@types/node is on major 20', () => {
    const raw = pkg.devDependencies?.['@types/node'] ?? '';
    const major = parseInt(raw.replace(/^\^|~/, '').split('.')[0], 10);
    expect(major).toBe(20);
  });

  it('eslint-config-next is on major 15 (matches next major)', () => {
    const raw = pkg.devDependencies?.['eslint-config-next'] ?? '';
    const major = parseInt(raw.replace(/^\^|~/, '').split('.')[0], 10);
    expect(major).toBe(15);
  });

  it('drizzle-kit is 0.31.x or newer', () => {
    const raw = pkg.devDependencies?.['drizzle-kit'] ?? '';
    const clean = raw.replace(/^\^|~/, '');
    const [, minor] = clean.split('.').map(Number);
    expect(minor).toBeGreaterThanOrEqual(31);
  });
});
