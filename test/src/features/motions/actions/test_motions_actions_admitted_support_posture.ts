import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  admittedSupportPosture
} from "../../../../../packages/motions/src/actions/internal/admittedSupportPosture";
import { TestValidator } from "@nestia/e2e";

/**
 * Support admission keeps a prior key's identity only for its certified shape.
 *
 * Scenarios:
 *
 * 1. Equal independent root and joint data preserve the entered key's identity.
 * 2. A changed anchor, angle or joint name returns the certified key. Equal counts
 *    of undefined joint entries cannot conceal different names.
 */
export function test_motions_actions_admitted_support_posture(): void {
  const before: IAutoMovieMotionHumanPosture = {
    root: { x: 2, y: 3, z: 4 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    limbs: {},
    joints: { spine: [1, 2, 3], head: undefined },
  };
  const identical: IAutoMovieMotionHumanPosture = {
    ...before,
    root: { ...before.root },
    joints: { head: undefined, spine: [1, 2, 3] },
  };
  const shifted: IAutoMovieMotionHumanPosture = {
    ...identical,
    root: { ...identical.root, z: 5 },
  };
  const turned: IAutoMovieMotionHumanPosture = {
    ...identical,
    joints: { ...identical.joints, spine: [1, 2, 4] },
  };
  const renamed: IAutoMovieMotionHumanPosture = {
    ...identical,
    joints: { spine: [1, 2, 3], neck: undefined },
  };
  TestValidator.predicate(
    "reuse only the actually admitted key",
    admittedSupportPosture(before, identical) === before &&
      admittedSupportPosture(before, shifted) === shifted &&
      admittedSupportPosture(before, turned) === turned &&
      admittedSupportPosture(before, renamed) === renamed,
  );
}
