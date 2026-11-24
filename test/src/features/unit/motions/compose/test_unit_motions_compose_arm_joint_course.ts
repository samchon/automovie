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

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of one shared joint-space carry and one blend, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMovieMotionHumanArmJointCourse` solves a joint-space carry
 * (`AutoMovieMotionHumanArm.carry`) once at knots on the frame grid of its span
 * and reads a second between two knots by blending their joints; a plan's
 * `carrier` carries by the joint-space carry until its `prepare` reads the
 * knots through the plan's own posture.
 *
 * The average man's left hand is carried from where it hangs toward 0.2 m up
 * and forward, its share rising linearly over 1 s.
 *
 * Scenarios:
 *
 * 1. At a knot (0.1 s, the third frame of 1/30 s) the course shows the carry of
 *    that second.
 * 2. At share 1 the posture is returned as it is, the goal for the display; at
 *    share 0 the arm holds its given angles.
 * 3. A carrier carries by the joint-space carry before its preparation and by the
 *    course after it.
 */
export async function test_unit_motions_compose_arm_joint_course(): Promise<void> {
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
    held: (): typeof held => held,
    share: seconds,
  });
  const course: AutoMovieMotionHumanArmJointCourse.Course =
    AutoMovieMotionHumanArmJointCourse(body, 1, input);
  const carried: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanArm.carry(
    body,
    reaching,
    held,
    0.1,
  );
  const same = (
    a: IAutoMovieMotionHumanPosture,
    b: IAutoMovieMotionHumanPosture,
  ): boolean =>
    (["leftUpperArm", "leftLowerArm", "leftHand"] as const).every(
      (bone): boolean =>
        [0, 1, 2].every((i: number): boolean =>
          nclose(a.joints[bone]![i]!, b.joints[bone]![i]!, ROUNDING),
        ),
    );

  // 1. At a knot.
  TestValidator.predicate(
    "a knot shows the carry of its second",
    same(course(0.1, input(0.1)), carried) &&
      course(0.1, input(0.1)).limbs.leftArm === undefined,
  );

  // 2. The ends.
  TestValidator.predicate(
    "the ends return the goal and hold the angles",
    course(1, input(1)) === reaching &&
      course(0, input(0)).joints.leftUpperArm === held.left!.upper,
  );

  // 3. A carrier.
  const carrier: AutoMovieMotionHumanArmJointCourse.ICarrier =
    AutoMovieMotionHumanArmJointCourse.carrier(body);
  const posture = (seconds: number): IAutoMovieMotionHumanPosture =>
    carrier.carry(seconds, input(seconds));
  const before: IAutoMovieMotionHumanPosture = posture(0.1);
  carrier.prepare(1, posture);
  TestValidator.predicate(
    "the carrier carries cold, then by its course",
    same(before, carried) && same(posture(0.1), course(0.1, input(0.1))),
  );
}
