import { seededValue } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `seededValue` is one deterministic sample in [0, 1) from ordered seed parts.
 *
 * Scenarios:
 *
 * 1. The same parts give the same value, inside [0, 1).
 * 2. Order matters: (1, 2) and (2, 1) differ, and an extra part changes the value.
 * 3. 1000 consecutive seeds stay inside [0, 1) and their mean is near 1/2 (within
 *    0.05).
 */
export function test_engine_math_seeded_value(): void {
  const value: number = seededValue(1, 2, 3);
  TestValidator.equals("pure", seededValue(1, 2, 3), value);
  TestValidator.predicate("range", value >= 0 && value < 1);
  TestValidator.predicate("order", seededValue(1, 2) !== seededValue(2, 1));
  TestValidator.predicate(
    "extra part",
    seededValue(1, 2) !== seededValue(1, 2, 0),
  );
  let sum: number = 0;
  let inside: boolean = true;
  for (let seed: number = 0; seed < 1000; seed++) {
    const sample: number = seededValue(seed);
    inside &&= sample >= 0 && sample < 1;
    sum += sample;
  }
  TestValidator.predicate(
    "spread",
    inside && Math.abs(sum / 1000 - 0.5) < 0.05,
  );
}
