import assert from "node:assert/strict";


/** Assert that `actual` is within `tolerance` of `expected`, naming the value in the failure. */
export const near = (actual: number, expected: number, tolerance = 1e-9, what = "value"): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} ≠ ${expected} (±${tolerance})`);
};
