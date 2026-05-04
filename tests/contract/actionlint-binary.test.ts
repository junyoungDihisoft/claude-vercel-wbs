import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const BINARY = process.env.ACTIONLINT_BIN ?? 'actionlint';
const FIXTURE = resolve(__dirname, '../fixtures/broken-workflow.yml');

const isAvailable = (() => {
  try {
    execFileSync(BINARY, ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!isAvailable)('actionlint contract (Issue #45)', () => {
  it('exposes a parseable version (vX.Y.Z)', () => {
    const out = execFileSync(BINARY, ['-version'], { encoding: 'utf8' });
    expect(out).toMatch(/\d+\.\d+\.\d+/);
  });

  it('returns nonzero exit code for a known-broken workflow fixture', () => {
    let threw = false;
    try {
      execFileSync(BINARY, [FIXTURE], { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
