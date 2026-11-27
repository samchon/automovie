import { AutoMovieEngineMotionPlanting } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A foot position at a height. */
const foot: (
  y: number,
) => Map<
  AutoMovieHumanoidBone,
  Pick<IAutoMovieResolvedBone, "worldPosition">
> = (
  y: number,
): Map<AutoMovieHumanoidBone, Pick<IAutoMovieResolvedBone, "worldPosition">> =>
  new Map([["leftFoot", { worldPosition: { x: 0, y, z: 0 } }]]);

/**
 * `contactMask` marks each frame in which the effector is at or below the
 * ground plus a tolerance.
 *
 * Scenarios:
 *
 * 1. Over flat ground at 0 with tolerance 0.05, heights 0.04, 0.05 and 0.06 give
 *    contact, contact, no contact.
 * 2. A frame without the effector is not in contact.
 * 3. A negative tolerance is refused.
 */
export function test_engine_motion_contact_mask(): void {
  TestValidator.equals(
    "against the tolerance",
    AutoMovieEngineMotionPlanting.contactMask({
      effector: "leftFoot",
      resolved: [foot(0.04), foot(0.05), foot(0.06)],
      groundAt: (): number => 0,
      tolerance: 0.05,
    }),
    [true, true, false],
  );
  TestValidator.equals(
    "a missing effector",
    AutoMovieEngineMotionPlanting.contactMask({
      effector: "rightFoot",
      resolved: [foot(0)],
      groundAt: (): number => 0,
      tolerance: 0.05,
    }),
    [false],
  );
  TestValidator.predicate(
    "a negative tolerance",
    throwsError(
      () =>
        AutoMovieEngineMotionPlanting.contactMask({
          effector: "leftFoot",
          resolved: [foot(0)],
          groundAt: (): number => 0,
          tolerance: -1,
        }),
      "non-negative",
    ),
  );
}
