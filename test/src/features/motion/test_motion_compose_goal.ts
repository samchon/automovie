import { Quaternion } from "@automovie/engine";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanBase,
  AutoMovieMotionHumanGoal,
  AutoMovieMotionHumanLean,
  HumanFrame,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanActionPlan,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The body-free rules of the limb-goal, held-base and trunk-tilt primitives:
 * a limb goal a share of the way between two goals, a limb driven on the
 * clock, a base that holds one posture, and a tilt added to what the posture
 * holds.
 *
 * Scenarios:
 * 1. Between a planted goal at (0, 1, 0) heading 0° and a goal at (0.4, 1.2,
 *    0.2) heading 90° with a contact, weight 0 is the first goal itself, weight
 *    1 and beyond the second itself, and weight 0.5 has the midpoints of the
 *    point and of the bend hint, heading 45°, the second goal's contact and no
 *    plant.
 * 2. Mixing a goal attached to the head with a goal in the world throws.
 * 3. A drive of the right arm claims the right arm only; with no origin it
 *    leaves the goal the posture holds, with an origin it leaves that one, and
 *    it throws when the posture holds none and no origin is given. The left
 *    arm's goal and the joints stay as the posture has them.
 * 4. A pulse that rises over 0.2 to 0.4 s and falls over 0.6 to 0.8 s is
 *    written over 0.2 to 0.8 s, is half way at 0.3 s and at 0.7 s and at its
 *    goal at 0.5 s; with a size of 0.5 it is half way at 0.5 s.
 * 5. A still base returns the same posture at every second, lasts the
 *    duration given and carries the two ground plants of both feet over the
 *    shares given.
 * 6. A tilt claims the trunk and adds its pitch and roll to the posture's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public primitives and reads the returned goals, windows, channels, plans and angles; a mix that keeps a plant, a drive that leaves the wrong origin, a pulse on the wrong window or a tilt that replaces instead of adding fails.
 * @evidence contracts/development/testing.md#independent-expectations Midpoints are computed by hand from the stated goals, the heading half way between 0° and 90° is 45°, and shares are the clock's envelope at the midpoints of its windows.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both ends, a clamped weight and the middle of a mix, mismatched frames, a drive with and without an origin and without any goal, rising, full, falling and scaled pulses, two seconds of a held base and a tilt on a posture that already leans.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit that needs no body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_motion_compose_goal(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const from: IHumanPosture.IGoal = {
    point: { x: 0, y: 1, z: 0 },
    bend: { x: 0, y: 0.5, z: -1 },
    rotation: Quaternion.identity(),
    planted: true,
  };
  const to: IHumanPosture.IGoal = {
    point: { x: 0.4, y: 1.2, z: 0.2 },
    bend: { x: 0.2, y: 0.5, z: -1 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    contact: { x: 0, y: -0.05, z: 0.1 },
  };
  const halfway = (goal: IHumanPosture.IGoal): boolean =>
    close(goal.point.x, 0.2) &&
    close(goal.point.y, 1.1) &&
    close(goal.point.z, 0.1) &&
    close(goal.bend.x, 0.1) &&
    close(goal.bend.z, -1) &&
    Math.abs(HumanFrame.heading(goal.rotation!) - 45) < 1e-6;
  const arrived = (goal: IHumanPosture.IGoal): boolean =>
    close(goal.point.x, 0.4) &&
    close(goal.point.y, 1.2) &&
    close(goal.point.z, 0.2);

  const mixed: IHumanPosture.IGoal = AutoMovieMotionHumanGoal.mix(
    from,
    to,
    0.5,
  );
  TestValidator.predicate(
    "the ends of a mix are the goals themselves",
    AutoMovieMotionHumanGoal.mix(from, to, 0) === from &&
      AutoMovieMotionHumanGoal.mix(from, to, 1) === to &&
      AutoMovieMotionHumanGoal.mix(from, to, 3) === to,
  );
  TestValidator.predicate("a mix is half way", halfway(mixed));
  TestValidator.equals(
    "a mix keeps the asked contact and no plant",
    [mixed.contact, mixed.planted],
    [{ x: 0, y: -0.05, z: 0.1 }, undefined],
  );
  TestValidator.error("goals on different frames", (): unknown =>
    AutoMovieMotionHumanGoal.mix({ ...from, on: "head" }, to, 0.5),
  );

  const posture: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 5,
    roll: -2,
    joints: { head: [1, 2, 3] },
    limbs: { rightArm: from, leftArm: to },
  };
  const drive = (
    origin?: AutoMovieMotionHumanGoal.Frame,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanGoal.drive({
      limb: "rightArm",
      from: 0,
      to: 1,
      goal: (): IHumanPosture.IGoal => to,
      ...(origin === undefined ? {} : { origin }),
      weight: (): number => 0.5,
    });
  const driven: IHumanPosture = drive().write(posture, 0.5);
  TestValidator.equals("a drive claims its limb", drive().channels, [
    "rightArm",
  ]);
  TestValidator.predicate(
    "a drive leaves the posture's goal",
    halfway(driven.limbs.rightArm!) &&
      driven.limbs.leftArm === to &&
      driven.joints === posture.joints,
  );
  TestValidator.predicate(
    "a drive leaves its origin when given one",
    arrived(
      drive((): IHumanPosture.IGoal => to).write(posture, 0.5).limbs.rightArm!,
    ),
  );
  TestValidator.error("a drive with nothing to leave", (): unknown =>
    drive().write({ ...posture, limbs: {} }, 0.5),
  );

  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(1, [
    { name: "rise", seconds: 0.2 },
    { name: "peak", seconds: 0.4 },
    { name: "fall", seconds: 0.6 },
    { name: "rest", seconds: 0.8 },
  ]);
  const pulse = (size?: number): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanGoal.pulse(
      clock,
      "rightArm",
      ["rise", "peak"],
      ["fall", "rest"],
      (): IHumanPosture.IGoal => to,
      undefined,
      size,
    );
  TestValidator.predicate(
    "a pulse rises, holds and falls",
    close(pulse().from, 0.2) &&
      close(pulse().to, 0.8) &&
      halfway(pulse().write(posture, 0.3).limbs.rightArm!) &&
      arrived(pulse().write(posture, 0.5).limbs.rightArm!) &&
      halfway(pulse().write(posture, 0.7).limbs.rightArm!) &&
      halfway(pulse(0.5).write(posture, 0.5).limbs.rightArm!),
  );

  const base: IHumanActionPlan = AutoMovieMotionHumanBase.still(
    2,
    posture,
    AutoMovieMotionHumanBase.plants(0.25, 0.75),
  );
  TestValidator.predicate(
    "a still base holds its posture",
    base.duration === 2 &&
      base.posture(0) === posture &&
      base.posture(1.7) === posture,
  );
  TestValidator.equals(
    "a still base stands on both feet",
    base.contacts.map((c) => [c.part, c.kind, c.from, c.to, c.support.kind]),
    [
      ["leftFoot", "plant", 0.25, 0.75, "ground"],
      ["rightFoot", "plant", 0.25, 0.75, "ground"],
    ],
  );

  const tilt: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.tilt({
    from: 0,
    to: 1,
    angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
      pitch: 10 * seconds,
      roll: 4,
    }),
  });
  const tilted: IHumanPosture = tilt.write(posture, 0.5);
  TestValidator.equals("a tilt claims the trunk", tilt.channels, ["trunk"]);
  TestValidator.predicate(
    "a tilt adds to the posture's lean",
    close(tilted.pitch, 10) && close(tilted.roll, 2) && tilted.yaw === 0,
  );
}
