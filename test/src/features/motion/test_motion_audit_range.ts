import type { IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";
import { AutoMovieMotionHumanAuditRange } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The range audit complains about a joint bent past what a body can do,
 * and only about that.
 *
 * Each film is a pose the test writes by hand, 1 s long and read at 24
 * instants per second, so the 25 instants are 0, 1/24, ... 1. The limits
 * are the clinical ones the humanoid range table states: the elbow flexes
 * 0 to 150 degrees and does not abduct, the hip flexes to 120 and abducts
 * to 45 inside a 120 degree swing cone, and the neck twists 70 either way.
 *
 * Scenarios:
 * 1. A pose with no joint, and one with every stated joint inside its
 *    range, read no overshoot at `none` and a share of 0.
 * 2. An elbow flexing from 150 by 12 degrees per second overshoots by 12 at
 *    1 s on `leftLowerArm flexion`, in the 24 instants after the first.
 * 3. An elbow bent backward by 7 degrees throughout overshoots by 7 at
 *    every instant.
 * 4. An elbow abducted by 9 degrees overshoots by the whole 9: the joint
 *    has no such axis.
 * 5. A hip at 120 of flexion and 45 of abduction, each inside its own
 *    interval, overshoots the swing cone by `2 acos(cos 60 cos 22.5) - 120`
 *    degrees on `rightUpperLeg swing`.
 * 6. Of a neck twisted 5 degrees past and an elbow flexed 20 past, the
 *    worst is reported: 20 on the elbow.
 * 7. A flexion that is not a number reads as an infinite overshoot.
 * 8. A bone the table does not list is not read, and a rate of zero is
 *    refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public reading on broken poses; a missed backward elbow, a missing axis taken as free, a cone not read, or a share that counts clean instants fails.
 * @evidence contracts/development/testing.md#independent-expectations Each overshoot is the angle the test wrote minus the clinical limit stated above, the cone's by the closed form of two orthogonal rotations, and each share a count of the film's instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Clean, past a maximum, past a minimum, on an absent axis, past a cone with both axes legal, two faults at once, a non-number, an unlisted bone and a bad rate.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-written poses; no body is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation States the film, the limits and the 8 scenarios with their numbers.
 */
export function test_motion_audit_range(): void {
  type Joints = (seconds: number) => IAutoMovieJointPose[];
  const joint = (
    bone: IAutoMovieJointPose["bone"],
    flexion: number | null,
    abduction: number | null = null,
    twist: number | null = null,
  ): IAutoMovieJointPose => ({ bone, flexion, abduction, twist });
  const read = (
    joints: Joints,
    rate: number = 24,
  ): AutoMovieMotionHumanAuditRange.IResult =>
    AutoMovieMotionHumanAuditRange.measure(
      {
        duration: 1,
        pose: (_subject: string, seconds: number): IAutoMoviePose => ({
          skeleton: "humanoid",
          root: null,
          joints: joints(seconds),
        }),
      },
      "a",
      rate,
    );
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const clean: AutoMovieMotionHumanAuditRange.IResult = {
    overshoot: { value: 0, seconds: 0, where: "none" },
    share: 0,
  };

  // 1. Clean poses.
  TestValidator.equals(
    "a pose with no joint is clean",
    read((): IAutoMovieJointPose[] => []),
    clean,
  );
  TestValidator.equals(
    "joints at their limits and at rest are clean",
    read((): IAutoMovieJointPose[] => [
      joint("leftLowerArm", 150, null, -90),
      joint("rightLowerArm", 0, 0, 90),
      joint("leftUpperLeg", 90, 20, 45),
      joint("neck", -50, 40, 70),
      joint("leftIndexProximal", 100),
      joint("rightFoot", null),
    ]),
    clean,
  );

  // 2. Past a maximum, growing.
  const flexed: AutoMovieMotionHumanAuditRange.IResult = read(
    (t: number): IAutoMovieJointPose[] => [joint("leftLowerArm", 150 + 12 * t)],
  );
  TestValidator.predicate(
    `an elbow flexed past 150 overshoots by what it exceeds, got ${flexed.overshoot.value} at ${flexed.overshoot.seconds} s on ${flexed.overshoot.where} over a share of ${flexed.share}`,
    near(flexed.overshoot.value, 12) &&
      near(flexed.overshoot.seconds, 1) &&
      flexed.overshoot.where === "leftLowerArm flexion" &&
      near(flexed.share, 24 / 25),
  );

  // 3. Past a minimum.
  const backward: AutoMovieMotionHumanAuditRange.IResult = read(
    (): IAutoMovieJointPose[] => [joint("rightLowerArm", -7)],
  );
  TestValidator.predicate(
    `a backward elbow overshoots by its angle, got ${backward.overshoot.value} on ${backward.overshoot.where}`,
    near(backward.overshoot.value, 7) &&
      backward.overshoot.where === "rightLowerArm flexion" &&
      backward.share === 1,
  );

  // 4. An axis the joint does not have.
  const sideways: AutoMovieMotionHumanAuditRange.IResult = read(
    (): IAutoMovieJointPose[] => [joint("leftLowerArm", 90, 9)],
  );
  TestValidator.predicate(
    `an elbow bent sideways overshoots by the whole angle, got ${sideways.overshoot.value} on ${sideways.overshoot.where}`,
    near(sideways.overshoot.value, 9) &&
      sideways.overshoot.where === "leftLowerArm abduction",
  );

  // 5. The swing cone.
  const cone: number =
    (2 *
      Math.acos(
        Math.cos((60 * Math.PI) / 180) * Math.cos((22.5 * Math.PI) / 180),
      ) *
      180) /
      Math.PI -
    120;
  const swung: AutoMovieMotionHumanAuditRange.IResult = read(
    (): IAutoMovieJointPose[] => [joint("rightUpperLeg", 120, 45)],
  );
  TestValidator.predicate(
    `a hip at both of its limits overshoots its cone by ${cone.toFixed(3)} degrees, got ${swung.overshoot.value} on ${swung.overshoot.where}`,
    cone > 4 &&
      cone < 6 &&
      near(swung.overshoot.value, cone) &&
      swung.overshoot.where === "rightUpperLeg swing",
  );

  // 6. The worst of two.
  const both: AutoMovieMotionHumanAuditRange.IResult = read(
    (): IAutoMovieJointPose[] => [
      joint("neck", 0, null, 75),
      joint("leftLowerArm", 170),
    ],
  );
  TestValidator.predicate(
    `the worst of two faults is reported, got ${both.overshoot.value} on ${both.overshoot.where}`,
    near(both.overshoot.value, 20) &&
      both.overshoot.where === "leftLowerArm flexion",
  );
  const lone: AutoMovieMotionHumanAuditRange.IResult = read(
    (): IAutoMovieJointPose[] => [joint("neck", 0, null, 75)],
  );
  TestValidator.predicate(
    `a neck twisted past 70 overshoots by what it exceeds, got ${lone.overshoot.value} on ${lone.overshoot.where}`,
    near(lone.overshoot.value, 5) && lone.overshoot.where === "neck twist",
  );

  // 7. Not a number.
  const broken: AutoMovieMotionHumanAuditRange.IResult = read(
    (t: number): IAutoMovieJointPose[] => [
      joint("leftLowerArm", t < 0.5 ? 30 : Number.NaN),
    ],
  );
  TestValidator.predicate(
    `an angle that is not a number is infinitely far, got ${broken.overshoot.value} from ${broken.overshoot.seconds} s`,
    broken.overshoot.value === Number.POSITIVE_INFINITY &&
      near(broken.overshoot.seconds, 0.5) &&
      near(broken.share, 13 / 25),
  );

  // 8. An unlisted bone, and a bad rate.
  TestValidator.equals(
    "the hips, which the table does not list, are not read",
    read((): IAutoMovieJointPose[] => [joint("hips", 400, 400, 400)]),
    clean,
  );
  TestValidator.error("a rate of zero is refused", (): void => {
    read((): IAutoMovieJointPose[] => [], 0);
  });
}
