import {
  walkLeg
} from "../../../../../packages/motions/src/actions/internal/walkLeg";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few trigonometric products, degrees and radians. */
const ROUNDING: number = 1e-9;

/**
 * Rounding of a straight knee, degrees: `acos` at 1 keeps only half the digits
 * of its argument, so a cosine one rounding off 1 reads about a microdegree.
 */
const STRAIGHT: number = 1e-5;

/**
 * `walkLeg.trailing` is how far a thigh trails behind vertical in the pelvis's
 * sagittal plane: the hip-to-ankle line's angle back from vertical, less the
 * knee's bend at that reach (`prepareBehind`, the law of cosines on the thigh,
 * the shank and the hip-to-ankle distance, a reach past the straight leg read
 * straight).
 *
 * Scenarios, 0.4 m thighs and shanks, the pelvis facing +Z:
 *
 * 1. A straight leg, the ankle 0.8 m below the hip, trails 0.
 * 2. The same leg with the ankle 30 degrees behind trails 30, and turned with the
 *    pelvis to face +X, the ankle behind along -X, again 30.
 * 3. The ankle 0.4 m below the hip folds the knee by 60 degrees (an equilateral
 *    triangle), which brings the thigh 60 forward: it trails -60.
 * 4. `prepareBehind` reads 0 past the straight leg and pi / 3 at 0.4 m.
 */
export function test_motions_actions_walk_leg_trailing(): void {
  const legs: walkLeg.ILegs = { measure: { thigh: 0.4, shank: 0.4 } };
  const hip: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 };
  const back: number = (30 * Math.PI) / 180;
  TestValidator.predicate(
    "the trail",
    nclose(
      walkLeg.trailing(legs, hip, { x: 0, y: 0.2, z: 0 }, 0),
      0,
      STRAIGHT,
    ) &&
      nclose(
        walkLeg.trailing(
          legs,
          hip,
          { x: 0, y: 1 - 0.8 * Math.cos(back), z: -0.8 * Math.sin(back) },
          0,
        ),
        30,
        STRAIGHT,
      ) &&
      nclose(
        walkLeg.trailing(
          legs,
          hip,
          { x: -0.8 * Math.sin(back), y: 1 - 0.8 * Math.cos(back), z: 0 },
          90,
        ),
        30,
        STRAIGHT,
      ) &&
      nclose(
        walkLeg.trailing(legs, hip, { x: 0, y: 0.6, z: 0 }, 0),
        -60,
        ROUNDING,
      ),
  );
  const behind: (reach: number) => number = walkLeg.prepareBehind(legs);
  TestValidator.predicate(
    "the knee",
    behind(1) === 0 && nclose(behind(0.4), Math.PI / 3, ROUNDING),
  );
}
