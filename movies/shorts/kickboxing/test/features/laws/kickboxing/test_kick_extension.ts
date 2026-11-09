import assert from "node:assert/strict";

import { StrikeShape } from "../../../../src/laws/kickboxing/StrikeShape";

/**
 * The round kick's extension follows the measured foot speeds.
 *
 * Scenarios: it starts at the chamber key and ends at impact; it never
 * turns back; it leaves the chamber at rest; it peaks before contact and
 * lands still travelling at the measured share of its peak (Muay Thai
 * 7.22 of 13.24 m/s).
 */
export function test_kick_extension(): void {
  assert.equal(StrikeShape.extension(0), 0);
  assert.ok(Math.abs(StrikeShape.extension(1) - 1) < 1e-12);
  const steps: number = 10_000;
  const slope = (k: number): number =>
    (StrikeShape.extension((k + 1) / steps) -
      StrikeShape.extension(k / steps)) *
    steps;
  let peak: number = 0;
  let at: number = 0;
  for (let k = 0; k < steps; k++) {
    const s: number = slope(k);
    assert.ok(s >= 0);
    if (s > peak) {
      peak = s;
      at = k / steps;
    }
  }
  assert.ok(slope(0) < 1e-3);
  assert.ok(at < 1);
  assert.ok(
    Math.abs(slope(steps - 1) / peak - StrikeShape.IMPACT_SPEED_SHARE) < 1e-3,
  );
}
