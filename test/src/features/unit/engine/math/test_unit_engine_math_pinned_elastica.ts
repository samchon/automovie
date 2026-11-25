import { pinnedElastica } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `pinnedElastica` gives the closed forms of a pinned-pinned elastica in its
 * parameter m: the chord-to-arc ratio 2E(m)/K(1 - m) - 1, its inverse, the
 * tangent angle 2 asin(sqrt(m) sn(K(1 - 2s), m)) at arc share s, and the
 * end-to-end curvature 4 sqrt(m) K(1 - m) / L.
 *
 * Scenarios:
 *
 * 1. m = 0 is the straight rod: chord ratio 1, no slope, no curvature; a ratio
 *    of 1 or more maps back to m = 0.
 * 2. The inverse recovers m = 0.5 from its own chord ratio.
 * 3. At m = 0.5 the end slope is 2 asin(sqrt(0.5)) = pi / 2 and the midpoint is
 *    flat, by sn(K) = 1 and sn(0) = 0.
 * 4. The ratio cannot reach the chord of the most bent parameter `HIGHEST`:
 *    that ratio itself is refused.
 */
export function test_unit_engine_math_pinned_elastica(): void {
  TestValidator.predicate(
    "the straight rod",
    nclose(pinnedElastica.chord(0), 1, 1e-12) &&
      pinnedElastica.slope(0, 0.25) === 0 &&
      pinnedElastica.curvature(0, 2) === 0 &&
      pinnedElastica.parameter(1) === 0 &&
      pinnedElastica.parameter(1.5) === 0,
  );
  TestValidator.predicate(
    "the inverse recovers the parameter",
    nclose(pinnedElastica.parameter(pinnedElastica.chord(0.5)), 0.5, 1e-9),
  );
  TestValidator.predicate(
    "the end is steep and the middle flat",
    nclose(pinnedElastica.slope(0.5, 0), Math.PI / 2, 1e-9) &&
      nclose(pinnedElastica.slope(0.5, 0.5), 0, 1e-12),
  );
  TestValidator.predicate(
    "a ratio past the fully bent limit is refused",
    throwsError(
      (): number =>
        pinnedElastica.parameter(pinnedElastica.chord(pinnedElastica.HIGHEST)),
      "shortens to",
    ),
  );
}
