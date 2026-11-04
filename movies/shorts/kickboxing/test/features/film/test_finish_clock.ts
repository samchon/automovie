import assert from "node:assert/strict";

import { placeFilmFinish } from "../../../src/film/placeFilmFinish";

/**
 * Preserve actual final-action durations while placing contact at the commissioned time.
 * Scenarios:
 * 1. Positive source spans preserve their actual durations and place contact at150.
 * 2. A different setup onset leaves the original technique onsets unchanged.
 * 3. Impossible, nonpositive and nonfinite input intervals refuse.
 * @evidence contracts/testing.md#observable-behavior Calls the consumed placement function and verifies that the original handoff and witness durations survive unchanged, the visible setup has positive time, and an impossible fit refuses rather than freezing or stretching a technique.
 * @evidence contracts/testing.md#independent-cases A synthetic observed0.4-second handoff followed by a0.3-second witness must begin at149.3 and149.7 for impact150, leaving2.3 seconds after147. Different onset and invalid boundary inputs distinguish source-clock preservation from a hardcoded finishing label. Actual motion and contact require the native module and Viewer checks.
 */
export function test_finish_clock(): void {
  const placement: ReturnType<typeof placeFilmFinish> = placeFilmFinish(
    147,
    150,
    0.4,
    0.3,
  );
  assert.ok(Math.abs(placement.hookStart - 149.3) < 1e-12);
  assert.ok(Math.abs(placement.kickStart - 149.7) < 1e-12);
  assert.ok(Math.abs(placement.setupDuration - 2.3) < 1e-12);
  assert.ok(Math.abs(placement.kickStart - placement.hookStart - 0.4) < 1e-12);
  assert.equal(placement.kickStart + 0.3, 150);
  assert.equal(
    placeFilmFinish(140, 150, 0.4, 0.3).kickStart,
    placement.kickStart,
  );
  for (const values of [
    [150, 150, 0.4, 0.3],
    [149.9, 150, 0.4, 0.3],
    [147, 150, 0, 0.3],
    [147, 150, 0.4, -0.3],
    [NaN, 150, 0.4, 0.3],
    [147, Infinity, 0.4, 0.3],
  ])
    assert.throws(() =>
      placeFilmFinish(values[0]!, values[1]!, values[2]!, values[3]!),
    );
}
