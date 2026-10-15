import assert from "assert/strict";


export const near = (actual: number, expected: number, tolerance = 1e-9, what = "value"): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} ≠ ${expected} (±${tolerance})`);
};
