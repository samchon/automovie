import { punchCompose } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Two affine blends and decimal input rounding use fewer than 16 ulps at unit scale. */
const BLEND_ROUNDING: number = 16 * Number.EPSILON;

/**
 * A composed punch's arm (`punchCompose.held`, `elbow`): the reference leaves
 * the launch by the wrist's share out less its share back, within 0 to 1; the
 * elbow's hint goes toward the contact's hint by the share out, then toward the
 * guard by the share back.
 *
 * Scenarios:
 *
 * 1. Out 0.7 and back 0.2 holds half; back more than out holds none; out past the
 *    end holds all.
 * 2. Halfway out the elbow is halfway to the hint; all the way back it is at the
 *    guard; halfway back from halfway out it is at (0.25, 0.5, 0).
 */
export function test_motions_striking_punch_compose(): void {
  TestValidator.predicate(
    "held share stays within its interval",
    nclose(punchCompose.held(0.7, 0.2), 0.5, BLEND_ROUNDING) &&
      punchCompose.held(0.1, 0.5) === 0 &&
      punchCompose.held(1.5, 0) === 1,
  );
  const start = { x: 0, y: 0, z: 0 };
  const hint = { x: 1, y: 0, z: 0 };
  const guard = { x: 0, y: 1, z: 0 };
  TestValidator.predicate(
    "the elbow",
    vclose(
      punchCompose.elbow(start, hint, guard, 0.5, 0),
      { x: 0.5, y: 0, z: 0 },
      BLEND_ROUNDING,
    ) &&
      vclose(punchCompose.elbow(start, hint, guard, 0.5, 1), guard, BLEND_ROUNDING) &&
      vclose(
        punchCompose.elbow(start, hint, guard, 0.5, 0.5),
        { x: 0.25, y: 0.5, z: 0 },
        BLEND_ROUNDING,
      ),
  );
}
