import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { gestureJoints } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few trigonometric products, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `gestureJoints` sets the joints a gesture moves directly at a share of its
 * stroke, scaled by its envelope and extent: a nod flexes the head by its angle
 * on `0.5 - 0.5 cos(2 pi cycles u)`, a shrug raises both girdles and tilts the
 * head, a slump flexes the chest, the spine and the head and protracts the
 * girdles; `add` adds the same deltas to a record, and a hand gesture sets
 * none.
 *
 * Scenarios:
 *
 * 1. A two-cycle nod at a quarter of its stroke, at full envelope and extent,
 *    flexes the head its full `ANGLES.nod`; at the start, none.
 * 2. A shrug at half envelope raises each girdle by half `ANGLES.shrug` and tilts
 *    the head by half `ANGLES.shrugHead`.
 * 3. A slump at full envelope and twice the extent, added to a chest already
 *    flexed 5 degrees, flexes it to 5 + 2 `ANGLES.slumpChest`.
 * 4. A wave sets no joint.
 */
export function test_unit_motions_everyday_gesture_joints(): void {
  TestValidator.predicate(
    "a nod",
    nclose(
      gestureJoints.at("nod", 0.25, 2, 1, 1).head![0],
      gestureJoints.ANGLES.nod,
      ROUNDING,
    ) && nclose(gestureJoints.at("nod", 0, 2, 1, 1).head![0], 0, ROUNDING),
  );
  const shrug: IAutoMovieMotionHumanPosture["joints"] = gestureJoints.at(
    "shrug",
    0.5,
    1,
    0.5,
    1,
  );
  TestValidator.predicate(
    "a shrug",
    nclose(shrug.leftShoulder![1], gestureJoints.ANGLES.shrug / 2, ROUNDING) &&
      nclose(
        shrug.rightShoulder![1],
        gestureJoints.ANGLES.shrug / 2,
        ROUNDING,
      ) &&
      nclose(shrug.head![1], gestureJoints.ANGLES.shrugHead / 2, ROUNDING),
  );
  const joints: IAutoMovieMotionHumanPosture["joints"] = { chest: [5, 0, 0] };
  gestureJoints.add(joints, "slump", 0.5, 1, 1, 2);
  TestValidator.predicate(
    "an added slump",
    nclose(
      joints.chest![0],
      5 + 2 * gestureJoints.ANGLES.slumpChest,
      ROUNDING,
    ) &&
      nclose(joints.spine![0], 2 * gestureJoints.ANGLES.slumpSpine, ROUNDING),
  );
  TestValidator.equals("a wave", gestureJoints.at("wave", 0.5, 1, 1, 1), {});
}
