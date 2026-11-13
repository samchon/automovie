import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditReach,
  IAutoMovieMotionHumanAuditMotion,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The reach audit complains about a hand that never arrives, a hand that
 * leaves its place during a hold, and an axis that points away from its
 * stated direction.
 *
 * Every motion is one right hand written in closed form: its centre at a
 * stated point and its frame turned about the world's forward axis by a
 * stated angle, so its own up axis stands that angle from vertical.
 *
 * Scenarios:
 * 1. A hand that travels 0.3 m in a line to its place over 1 s is 0.3 m away
 *    at 0 s and on it at 1 s.
 * 2. A hand that covers only 0.26 m of that way never gets nearer than 40 mm.
 * 3. A hand on its place that lifts off by a 50 mm half sine between 0.4 and
 *    0.6 s is 50 mm away at 0.5 s, while its nearest stays 0.
 * 4. A hand 20 mm beside a place that moves at 1 m/s, moving with it, is
 *    20 mm away throughout; the same hand against the place's first position
 *    ends 1 m away.
 * 5. An up axis held 53 degrees from vertical reads 53 at both ends; one that
 *    tips from 0 to 30 degrees over 1 s reads 30 at 1 s and 0 at 0 s; the
 *    lengths of the axis and of the direction change nothing; against the
 *    downward direction an upright axis reads 180.
 * 6. A bone that is not displayed, a direction of no length, a reversed span
 *    and a rate of 0 are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public readings on written motions; a late arrival, a lift during a hold or a tilt that goes unread, or is read at the wrong instant, fails.
 * @evidence contracts/development/testing.md#independent-expectations Every distance and angle is the one the motion was written with.
 * @evidence contracts/development/testing.md#distinguishing-cases An arrival against a shortfall, a kept place against a left one, a moving place against a fixed one, a held tilt against a growing one, and four refusals.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-written motions; nothing is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation States the written motion and the 6 scenarios with their numbers.
 */
export function test_motion_audit_reach(): void {
  const hand = (
    at: (seconds: number) => IAutoMovieVector3,
    degrees: (seconds: number) => number,
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 1,
    segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [],
    bones: (
      _subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const half: number = (degrees(seconds) * Math.PI) / 360;
      const rotation: IAutoMovieResolvedBone["worldRotation"] = {
        x: 0,
        y: 0,
        z: Math.sin(half),
        w: Math.cos(half),
      };
      return new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
        [
          "rightHand",
          {
            bone: "rightHand",
            localRotation: rotation,
            worldPosition: at(seconds),
            worldRotation: rotation,
          },
        ],
      ]);
    },
  });
  const centre = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 => bones.get("rightHand")!.worldPosition;
  const place: IAutoMovieVector3 = { x: 0.3, y: 1, z: 0 };
  const span: AutoMovieMotionHumanAuditReach.ISpan = { from: 0, to: 1 };
  const near = (label: string, got: number, expected: number): void => {
    TestValidator.predicate(
      `${label}: expected ${expected}, got ${got}`,
      Math.abs(got - expected) <= 1e-9,
    );
  };
  const gap = (
    at: (seconds: number) => IAutoMovieVector3,
    to: (seconds: number) => IAutoMovieVector3,
  ): AutoMovieMotionHumanAuditReach.IResult =>
    AutoMovieMotionHumanAuditReach.gap(
      hand(at, (): number => 0),
      "a",
      centre,
      to,
      span,
      "right palm",
    );

  // 1. An arrival.
  const arrives: AutoMovieMotionHumanAuditReach.IResult = gap(
    (t: number): IAutoMovieVector3 => ({ x: 0.3 * t, y: 1, z: 0 }),
    (): IAutoMovieVector3 => place,
  );
  near("the hand starts 0.3 m away", arrives.worst.value, 0.3);
  near("it is farthest at the start", arrives.worst.seconds, 0);
  near("the hand arrives", arrives.best.value, 0);
  near("it arrives at the end", arrives.best.seconds, 1);
  TestValidator.equals(
    "the reading carries its name",
    arrives.best.where,
    "right palm",
  );

  // 2. A shortfall.
  const short: AutoMovieMotionHumanAuditReach.IResult = gap(
    (t: number): IAutoMovieVector3 => ({ x: 0.26 * t, y: 1, z: 0 }),
    (): IAutoMovieVector3 => place,
  );
  near("a hand 40 mm short never arrives", short.best.value, 0.04);
  near("its nearest is at the end", short.best.seconds, 1);

  // 3. A place left during a hold.
  const lifts: AutoMovieMotionHumanAuditReach.IResult = gap(
    (t: number): IAutoMovieVector3 => ({
      x: place.x,
      y:
        place.y +
        (t > 0.4 && t < 0.6 ? 0.05 * Math.sin((Math.PI * (t - 0.4)) / 0.2) : 0),
      z: 0,
    }),
    (): IAutoMovieVector3 => place,
  );
  near("a hand that lifts 50 mm is read", lifts.worst.value, 0.05);
  near("at the top of the lift", lifts.worst.seconds, 0.5);
  near("though it is on its place otherwise", lifts.best.value, 0);

  // 4. A moving place.
  const moving = (t: number): IAutoMovieVector3 => ({ x: t, y: 1, z: 0 });
  const beside = (t: number): IAutoMovieVector3 => ({ x: t, y: 1, z: 0.02 });
  const follows: AutoMovieMotionHumanAuditReach.IResult = gap(beside, moving);
  near("a hand that follows stays 20 mm away", follows.worst.value, 0.02);
  near("at its nearest too", follows.best.value, 0.02);
  const left: AutoMovieMotionHumanAuditReach.IResult = gap(
    beside,
    (): IAutoMovieVector3 => moving(0),
  );
  near(
    "against where the place was, it ends 1 m away",
    left.worst.value,
    Math.hypot(1, 0.02),
  );
  near("at the end", left.worst.seconds, 1);

  // 5. An axis.
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const tilt = (
    degrees: (seconds: number) => number,
    axis: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): AutoMovieMotionHumanAuditReach.IResult =>
    AutoMovieMotionHumanAuditReach.tilt(
      hand((): IAutoMovieVector3 => place, degrees),
      "a",
      "rightHand",
      axis,
      (): IAutoMovieVector3 => toward,
      span,
    );
  const held: AutoMovieMotionHumanAuditReach.IResult = tilt(
    (): number => 53,
    up,
    up,
  );
  near("an axis held at 53 degrees reads 53", held.worst.value, 53);
  near("at its best too", held.best.value, 53);
  TestValidator.equals(
    "the reading names the bone",
    held.worst.where,
    "rightHand axis",
  );
  const tips: AutoMovieMotionHumanAuditReach.IResult = tilt(
    (t: number): number => 30 * t,
    up,
    up,
  );
  near("an axis that tips to 30 degrees reads 30", tips.worst.value, 30);
  near("at the end", tips.worst.seconds, 1);
  near("and 0 upright", tips.best.value, 0);
  near("at the start", tips.best.seconds, 0);
  near(
    "lengths change nothing",
    tilt((): number => 53, { x: 0, y: 2, z: 0 }, { x: 0, y: 5, z: 0 }).worst
      .value,
    53,
  );
  near(
    "an upright axis against down reads 180",
    tilt((): number => 0, up, { x: 0, y: -1, z: 0 }).worst.value,
    180,
  );

  // 6. Refusals.
  const still: IAutoMovieMotionHumanAuditMotion = hand(
    (): IAutoMovieVector3 => place,
    (): number => 0,
  );
  TestValidator.error("a bone not displayed is refused", (): void => {
    AutoMovieMotionHumanAuditReach.tilt(
      still,
      "a",
      "leftHand",
      up,
      (): IAutoMovieVector3 => up,
      span,
    );
  });
  TestValidator.error("a direction of no length is refused", (): void => {
    tilt((): number => 0, up, { x: 0, y: 0, z: 0 });
  });
  TestValidator.error("a reversed span is refused", (): void => {
    AutoMovieMotionHumanAuditReach.gap(
      still,
      "a",
      centre,
      (): IAutoMovieVector3 => place,
      { from: 1, to: 0 },
      "right palm",
    );
  });
  TestValidator.error("a rate of 0 is refused", (): void => {
    AutoMovieMotionHumanAuditReach.gap(
      still,
      "a",
      centre,
      (): IAutoMovieVector3 => place,
      { from: 0, to: 1, rate: 0 },
      "right palm",
    );
  });
}
