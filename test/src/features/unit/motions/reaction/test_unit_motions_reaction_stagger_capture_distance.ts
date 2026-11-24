import { staggerCaptureDistance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `staggerCaptureDistance` is Koolen's N-step capture distance in closed form:
 * `r` with no step, `r + (l − r + d_(N−1)) e^(-ω T_1)` for N steps, `d_n = r +
 * l q (1 − qⁿ) / (1 − q)` and `q = e^(-ω T_s)`.
 *
 * A pendulum at ω = 3 /s, a 0.1 m reach, 0.8 m steps of 0.3 s and a first step
 * of 0.5 s: `q = e^-0.9` and the first step's factor `e^-1.5`.
 *
 * Scenarios:
 *
 * 1. No step reaches the base's 0.1 m.
 * 2. One step adds `0.8 e^-1.5`, two add `(0.8 + 0.8 q) e^-1.5`.
 * 3. Many steps approach `0.1 + (0.8 + 0.8 q / (1 − q)) e^-1.5`, each adding less
 *    than the one before.
 */
export function test_unit_motions_reaction_stagger_capture_distance(): void {
  const d: (steps: number) => number = staggerCaptureDistance({
    w: 3,
    reach: 0.1,
    longest: 0.8,
    step: 0.3,
    first: 0.5,
  });
  const q: number = Math.exp(-0.9);
  const e: number = Math.exp(-1.5);
  TestValidator.predicate("no step", d(0) === 0.1);
  TestValidator.predicate(
    "one and two steps",
    nclose(d(1), 0.1 + 0.8 * e, 1e-12) &&
      nclose(d(2), 0.1 + (0.8 + 0.8 * q) * e, 1e-12),
  );
  TestValidator.predicate(
    "the limit",
    nclose(d(200), 0.1 + (0.8 + (0.8 * q) / (1 - q)) * e, 1e-12) &&
      d(3) - d(2) < d(2) - d(1),
  );
}
