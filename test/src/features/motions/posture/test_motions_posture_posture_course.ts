import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  prepareHumanPostureCourse
} from "../../../../../packages/motions/src/posture/internal/prepareHumanPostureCourse";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one quintic, in the coordinates' own units. */
const ROUNDING: number = 1e-9;

/**
 * A posture with a root height, a heading, the left forearm's twist and,
 * optionally, a left-hand goal at a height.
 */
function posture(
  height: number,
  yaw: number,
  twist: number,
  hand?: number,
): IAutoMovieMotionHumanPosture {
  return {
    root: { x: 0, y: height, z: 0 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: { leftLowerArm: [0, 0, twist] },
    limbs:
      hand === undefined
        ? {}
        : {
            leftArm: {
              point: { x: 0, y: hand, z: 0 },
              bend: { x: 0, y: hand, z: -1 },
            },
          },
  };
}

/**
 * `prepareHumanPostureCourse` joins key postures by the minimum-jerk path at
 * their seconds (Flash and Hogan 1985), each continuous field one coordinate,
 * heading and joint angles unwrapped knot to knot.
 *
 * Two knots: at 0 s the root at 0.9 m, heading 170 degrees, the left forearm
 * twisted 170 degrees and the left hand's goal at 1 m; at 1 s the root at 1.1
 * m, heading -170, the twist -170 and the goal at 1.2 m.
 *
 * Scenarios:
 *
 * 1. At the knots the course is the knots' postures.
 * 2. At the middle the root and the goal are halfway (the minimum-jerk path is
 *    symmetric), and the heading and the twist are 180: the short way.
 * 3. A limb only one knot sets is taken from the last knot at or before.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines minimum-jerk interpolation of continuous posture coordinates, angle unwrapping and last-held limb metadata.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares two authored poses with opposite angle signs and samples exact knots, midpoint and a limb set only by one pose.
 * @evidence contracts/development/testing.md#independent-expectations Quintic symmetry gives midpoint root 1 m and hand goal 1.1 m. The shortest +170° to −170° rotation passes through 180°.
 */
export function test_motions_posture_posture_course(): void {
  const course: (seconds: number) => IAutoMovieMotionHumanPosture =
    prepareHumanPostureCourse([
      { seconds: 0, posture: posture(0.9, 170, 170, 1) },
      { seconds: 1, posture: posture(1.1, -170, -170, 1.2) },
    ]);

  // 1. The knots.
  const start: IAutoMovieMotionHumanPosture = course(0);
  const end: IAutoMovieMotionHumanPosture = course(1);
  TestValidator.predicate(
    "the course passes through its knots",
    nclose(start.root.y, 0.9, ROUNDING) &&
      nclose(start.joints.leftLowerArm![2], 170, ROUNDING) &&
      nclose(end.root.y, 1.1, ROUNDING) &&
      nclose(end.yaw, 190, ROUNDING) &&
      nclose(end.joints.leftLowerArm![2], 190, ROUNDING),
  );

  // 2. The middle.
  const middle: IAutoMovieMotionHumanPosture = course(0.5);
  TestValidator.predicate(
    "halfway, the short way round",
    nclose(middle.root.y, 1, ROUNDING) &&
      nclose(middle.limbs.leftArm!.point.y, 1.1, ROUNDING) &&
      nclose(middle.yaw, 180, ROUNDING) &&
      nclose(middle.joints.leftLowerArm![2], 180, ROUNDING),
  );

  // 3. A limb one knot sets.
  const partial: (seconds: number) => IAutoMovieMotionHumanPosture =
    prepareHumanPostureCourse([
      { seconds: 0, posture: posture(0.9, 0, 0, 1) },
      { seconds: 1, posture: posture(0.9, 0, 0) },
    ]);
  TestValidator.predicate(
    "a limb one knot sets is held from it",
    partial(0.5).limbs.leftArm?.point.y === 1 &&
      partial(1).limbs.leftArm === undefined,
  );
}
