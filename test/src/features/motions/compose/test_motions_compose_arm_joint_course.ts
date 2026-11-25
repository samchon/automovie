import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanArmJointCourse,
  AutoMovieMotionHumanBend,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of one shared joint-space carry and one quintic, degrees. */
const ROUNDING: number = 1e-9;

/** The stretch the arm is carried over, seconds. */
const STRETCH: readonly [number, number] = [0, 1];

/**
 * `AutoMovieMotionHumanArmJointCourse` solves a joint-space carry
 * (`AutoMovieMotionHumanArm.carry`) once at knots AutoKnots places over the
 * stretch (`prepareHumanAdaptiveKnots`) and joins each arm's angles through
 * them by the minimum-jerk knot course; a plan's `carrier` carries by the
 * joint-space carry until its `prepare` reads the knots through the plan's own
 * posture.
 *
 * The average man's left hand is carried from where it hangs toward 0.2 m up
 * and forward, its share rising linearly over 1 s.
 *
 * Scenarios:
 *
 * 1. At 0.5 s, a knot (the first sweep's midpoint of the uniform knots at 0.4 and
 *    0.6 s), the course shows the carry of that second, the arm's goal
 *    dropped.
 * 2. At share 1 the posture is returned as it is, the goal for the display; at 0
 *    the course is at the held angles.
 * 3. A carrier carries by the joint-space carry before its preparation and by the
 *    course after it.
 *
 * The body is built whole (`humanFixtureBody`): the carry resolves the whole
 * posture and clears the arm against the body's colliders, reading its pose
 * rig, limb chains, ROM projection and collider bones.
 */
export async function test_motions_compose_arm_joint_course(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const rest: IAutoMoviePose = resolveHumanPosture(body, standing);
  const hang: IAutoMovieVector3 = poseBones(body, rest).get(
    "leftHand",
  )!.worldPosition;
  const held: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
  > = { left: AutoMovieMotionHumanArm.angles(rest, "left") };
  const reaching: IAutoMovieMotionHumanPosture = {
    ...standing,
    limbs: {
      leftArm: {
        point: { x: hang.x, y: hang.y + 0.2, z: hang.z + 0.2 },
        bend: AutoMovieMotionHumanBend.hang(body, standing, "left"),
      },
    },
  };
  const input = (
    seconds: number,
  ): AutoMovieMotionHumanArmJointCourse.IInput => ({
    posture: reaching,
    sides: ["left"],
    held,
    share: seconds,
  });
  const course: AutoMovieMotionHumanArmJointCourse.Course =
    AutoMovieMotionHumanArmJointCourse(body, [STRETCH], input);
  const carried: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanArm.carry(
    body,
    reaching,
    held,
    0.5,
  );
  const same = (
    a: IAutoMovieMotionHumanPosture,
    b: IAutoMovieMotionHumanPosture,
  ): boolean =>
    (["leftUpperArm", "leftLowerArm", "leftHand"] as const).every(
      (bone: "leftUpperArm" | "leftLowerArm" | "leftHand"): boolean =>
        [0, 1, 2].every((i: number): boolean =>
          nclose(a.joints[bone]![i]!, b.joints[bone]![i]!, ROUNDING),
        ),
    );

  // 1. At a knot.
  const middle: IAutoMovieMotionHumanPosture = course(0.5, reaching, 0.5);
  TestValidator.predicate(
    "a knot shows the carry of its second",
    same(middle, carried) && middle.limbs.leftArm === undefined,
  );

  // 2. The ends.
  const start: IAutoMovieMotionHumanPosture = course(0, reaching, 0);
  TestValidator.predicate(
    "the ends hold the angles and return the goal",
    course(1, reaching, 1) === reaching &&
      [0, 1, 2].every((i: number): boolean =>
        nclose(start.joints.leftUpperArm![i]!, held.left!.upper[i]!, ROUNDING),
      ),
  );

  // 3. A carrier.
  const carrier: AutoMovieMotionHumanArmJointCourse.ICarrier =
    AutoMovieMotionHumanArmJointCourse.carrier(body);
  const posture = (seconds: number): IAutoMovieMotionHumanPosture =>
    carrier.carry(seconds, input(seconds));
  const before: IAutoMovieMotionHumanPosture = posture(0.5);
  carrier.prepare([STRETCH], posture);
  TestValidator.predicate(
    "the carrier carries cold, then by its course",
    same(before, carried) &&
      carrier.solved &&
      same(posture(0.25), course(0.25, reaching, 0.25)),
  );
}
