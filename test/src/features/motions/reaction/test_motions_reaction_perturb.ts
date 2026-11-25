import { perturb, staggerBounds } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The `perturb` law's recovery step (`perturb.stepTime`): a push within 45
 * degrees of the heading is caught by a forward step, within 45 degrees of
 * behind by a backward step, and otherwise by a side step, each at `stagger`'s
 * step time (0.238, 0.193 and 0.1755 s).
 *
 * Scenario: heading +Z, pushes along +Z, -Z and +X take the forward, backward
 * and side steps; heading 90, a push along +X is a forward one; no push steps
 * forward.
 */
export function test_motions_reaction_perturb(): void {
  TestValidator.equals(
    "the step for the push",
    [
      perturb.stepTime({ x: 0, y: 0, z: 30 }, 0),
      perturb.stepTime({ x: 0, y: 0, z: -30 }, 0),
      perturb.stepTime({ x: 30, y: 0, z: 0 }, 0),
      perturb.stepTime({ x: 30, y: 0, z: 0 }, 90),
      perturb.stepTime({ x: 0, y: 0, z: 0 }, 0),
    ],
    [
      staggerBounds.STEP_TIME.forward,
      staggerBounds.STEP_TIME.backward,
      staggerBounds.STEP_TIME.side,
      staggerBounds.STEP_TIME.forward,
      staggerBounds.STEP_TIME.forward,
    ],
  );
}
