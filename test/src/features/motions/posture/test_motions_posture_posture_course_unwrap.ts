import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  prepareHumanPostureCourse
} from "../../../../../packages/motions/src/posture/internal/prepareHumanPostureCourse";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one quintic per coordinate, degrees. */
const ROUNDING: number = 1e-9;

/**
 * The largest change of an unwrapped angle over one 0.01 s read, degrees: 200
 * degrees a second, past the minimum-jerk path's rate through turns of at most
 * 40 degrees a second apart and far below a 360-degree jump.
 */
const STEP: number = 2;

/** The raw headings at 0, 1, 2 and 3 s, each wrapped into [-180, 180). */
const YAWS: readonly number[] = [170, -170, -150, 170];

/** Their unwrapped values: each turn the short way from the one before. */
const UNWRAPPED: readonly number[] = [170, 190, 210, 170];

/** The forearm's raw twists, a full turn and more in 20-degree steps. */
const TWISTS: readonly number[] = [170, -170, -150, -130];

/** Their unwrapped values. */
const TURNED: readonly number[] = [170, 190, 210, 230];

/** No turn, and the same turn by its other sign. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const OPPOSITE: IAutoMovieQuaternion = { x: -0, y: -0, z: -0, w: -1 };

/** A posture at a heading, a forearm twist and a left-hand goal rotation. */
function posture(
  yaw: number,
  twist: number,
  rotation: IAutoMovieQuaternion,
): IAutoMovieMotionHumanPosture {
  return {
    root: { x: 0, y: 0.9, z: 0 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: { leftLowerArm: [0, 0, twist] },
    limbs: {
      leftArm: {
        point: { x: 0.3, y: 1, z: 0.2 },
        bend: { x: 0.3, y: 1, z: -0.5 },
        rotation,
      },
    },
  };
}

/**
 * `prepareHumanPostureCourse` unwraps the heading and every joint angle knot to
 * knot, each the value nearest the one before by whole turns, so the course
 * turns the short way and never jumps by a turn; a goal rotation is kept in the
 * previous knot's hemisphere, so a quaternion and its negative, the same
 * rotation, do not pass through zero.
 *
 * Four knots a second apart: headings 170, -170, -150 and 170; forearm twists
 * 170, -170, -150 and -130; the hand's rotation alternating between the
 * identity and its negative.
 *
 * Scenarios:
 *
 * 1. At the knots the heading is 170, 190, 210 and 170, and the twist 170, 190,
 *    210 and 230: unwrapped, the twist past a whole half turn.
 * 2. On a 0.01 s grid no read changes the heading or the twist by more than two
 *    degrees: no 360-degree jump.
 * 3. The hand's rotation is the identity at every read, the knots' signs aligned,
 *    never the normalized zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines adjacent angular unwrap and quaternion hemisphere alignment through a multi-knot posture course.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares four authored angular knots and alternating identity signs, then samples them and a dense 0.01 s grid.
 * @evidence contracts/development/testing.md#independent-expectations Explicit nearest representatives produce headings 170, 190, 210, 170 and twists 170, 190, 210, 230. Sign changes never alter the identity orientation.
 */
export function test_motions_posture_posture_course_unwrap(): void {
  const course: (seconds: number) => IAutoMovieMotionHumanPosture =
    prepareHumanPostureCourse(
      YAWS.map(
        (yaw: number, k: number): prepareHumanPostureCourse.IKnot => ({
          seconds: k,
          posture: posture(yaw, TWISTS[k]!, k % 2 === 0 ? IDENTITY : OPPOSITE),
        }),
      ),
    );

  // 1. The knots, unwrapped.
  TestValidator.predicate(
    "the knots unwrapped the short way",
    UNWRAPPED.every((yaw: number, k: number): boolean => {
      const at: IAutoMovieMotionHumanPosture = course(k);
      return (
        nclose(at.yaw, yaw, ROUNDING) &&
        nclose(at.joints.leftLowerArm![2], TURNED[k]!, ROUNDING)
      );
    }),
  );

  // 2. No jump.
  const reads: IAutoMovieMotionHumanPosture[] = Array.from(
    { length: 301 },
    (_: unknown, i: number): IAutoMovieMotionHumanPosture => course(i / 100),
  );
  TestValidator.predicate(
    "no read jumps a turn",
    reads.every(
      (at: IAutoMovieMotionHumanPosture, i: number): boolean =>
        i === 0 ||
        (Math.abs(at.yaw - reads[i - 1]!.yaw) <= STEP &&
          Math.abs(
            at.joints.leftLowerArm![2] - reads[i - 1]!.joints.leftLowerArm![2],
          ) <= STEP),
    ),
  );

  // 3. One hemisphere.
  TestValidator.predicate(
    "the hand's rotation stays the identity",
    reads.every((at: IAutoMovieMotionHumanPosture): boolean => {
      const q: IAutoMovieQuaternion = at.limbs.leftArm!.rotation!;
      return nclose(Math.abs(q.w), 1, ROUNDING);
    }),
  );
}
