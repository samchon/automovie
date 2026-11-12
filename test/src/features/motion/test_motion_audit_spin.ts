import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  AutoMovieMotionHumanAuditSpin,
  type IAutoMovieMotionHumanAuditMotion,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The spin audit reads a bone that snaps to another orientation where no
 * joint centre moves, and reads nothing on a bone that turns smoothly.
 *
 * Each film is one second long and read at 24 instants per second. Every
 * named bone stays where it is and turns about the vertical by the angle the
 * film states, in degrees, so the joint-centre audit has nothing to read.
 *
 * Scenarios:
 * 1. A head that turns at a steady 90 degrees per second reads a spin of 90
 *    on `head` and no turn.
 * 2. A fingertip's phalanx that snaps 20 degrees at 0.4321 s reads a turn of
 *    20 on `leftIndexDistal` within one final interval, `1 / (24 * 2^10)` s,
 *    before the snap, and a spin of 480 at frame 10; the joint-centre audit
 *    reads no jump on the same film.
 * 3. A 12 degree snap on a hand that also turns at 200 degrees per second
 *    reads 12 within what the smooth turn adds over the final interval.
 * 4. A snap in the first interval of the film, and one in the last, are
 *    read: an end of the film hides nothing.
 * 5. A 3 degree snap is below the 5 degree limit and reads none; with a
 *    limit of 1 it reads 3.
 * 6. A head that starts turning from rest at 6000 degrees per second squared
 *    departs from its neighbours yet reads no turn.
 * 7. Of a jaw that snaps 10 degrees and toes that snap 25 in the same
 *    interval, the toes are reported.
 * 8. A rate of zero is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on films with a written snap; a leaf bone not read, a snap averaged away or lost at an end, a smooth start taken for a snap or the smaller of two reported fails.
 * @evidence contracts/development/testing.md#independent-expectations Each snap's size, bone and second are written into the film, each spin is the written rate, and the leftover of a smooth turn is its rate times the final interval.
 * @evidence contracts/development/testing.md#distinguishing-cases Steady, a snap on a leaf bone, a snap on a turning bone, snaps at both ends, either side of the limit, a smooth acceleration, two snaps at once and a bad rate.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-written orientations; no body is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation Names the defect, the films and the 8 scenarios with their numbers.
 */
export function test_motion_audit_spin(): void {
  type Angles = Partial<Record<AutoMovieHumanoidBone, number>>;
  const film = (
    at: (t: number) => Angles,
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 1,
    segments: (): [] => [],
    bones: (
      _subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
      let index: number = 0;
      for (const [bone, degrees] of Object.entries(at(seconds)) as [
        AutoMovieHumanoidBone,
        number,
      ][]) {
        const half: number = (degrees * Math.PI) / 360;
        out.set(bone, {
          bone,
          localRotation: { x: 0, y: 0, z: 0, w: 1 },
          worldPosition: { x: 0.1 * index++, y: 1, z: 0 },
          worldRotation: { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) },
        });
      }
      return out;
    },
  });
  const read = (
    at: (t: number) => Angles,
    limit: number = 5,
    rate: number = 24,
  ): AutoMovieMotionHumanAuditSpin.IResult =>
    AutoMovieMotionHumanAuditSpin.measure(film(at), "a", rate, limit);
  const show = (r: AutoMovieMotionHumanAuditSpin.IResult): string =>
    JSON.stringify(r);
  const snap = (t: number, at: number, size: number): number =>
    t >= at ? size : 0;
  const final: number = 1 / (24 * 2 ** AutoMovieMotionHumanAuditSpin.LEVELS);

  // 1. A steady turn.
  const steady: AutoMovieMotionHumanAuditSpin.IResult = read(
    (t: number): Angles => ({ head: 90 * t }),
  );
  TestValidator.predicate(
    `a steady turn has a spin and no snap, got ${show(steady)}`,
    Math.abs(steady.spin.value - 90) <= 1e-6 &&
      steady.spin.where === "head" &&
      steady.turn.value === 0 &&
      steady.turn.where === "none",
  );

  // 2. A leaf bone's snap, which no joint centre shows.
  const leaf = (t: number): Angles => ({
    leftHand: 0,
    leftIndexDistal: snap(t, 0.4321, 20),
  });
  const finger: AutoMovieMotionHumanAuditSpin.IResult = read(leaf);
  TestValidator.predicate(
    `a phalanx's 20 degree snap is read, got ${show(finger)}`,
    Math.abs(finger.turn.value - 20) <= 1e-6 &&
      finger.turn.where === "leftIndexDistal" &&
      finger.turn.seconds <= 0.4321 &&
      0.4321 - finger.turn.seconds <= final + 1e-12 &&
      Math.abs(finger.spin.value - 480) <= 1e-6 &&
      Math.abs(finger.spin.seconds - 10 / 24) <= 1e-9,
  );
  TestValidator.equals(
    "the joint centres of the same film show no jump",
    AutoMovieMotionHumanAuditContinuity.measure(film(leaf), "a").jump.value,
    0,
  );

  // 3. A snap on a turning bone.
  const turning: AutoMovieMotionHumanAuditSpin.IResult = read(
    (t: number): Angles => ({ rightHand: 200 * t + snap(t, 0.4321, 12) }),
  );
  TestValidator.predicate(
    `a 12 degree snap on a turning hand is read, got ${show(turning)}`,
    turning.turn.value >= 12 - 1e-6 &&
      turning.turn.value <= 12 + 200 * final + 1e-6 &&
      turning.turn.where === "rightHand",
  );

  // 4. Either end of the film.
  const early: AutoMovieMotionHumanAuditSpin.IResult = read(
    (t: number): Angles => ({ head: snap(t, 0.02, 8) }),
  );
  const late: AutoMovieMotionHumanAuditSpin.IResult = read(
    (t: number): Angles => ({ head: snap(t, 0.99, 8) }),
  );
  TestValidator.predicate(
    `a snap in the first interval is read, got ${show(early)}`,
    Math.abs(early.turn.value - 8) <= 1e-6 && early.turn.seconds <= 0.02,
  );
  TestValidator.predicate(
    `a snap in the last interval is read, got ${show(late)}`,
    Math.abs(late.turn.value - 8) <= 1e-6 &&
      late.turn.seconds <= 0.99 &&
      late.turn.seconds >= 23 / 24,
  );

  // 5. Either side of the limit.
  const small = (t: number): Angles => ({ jaw: snap(t, 0.4321, 3) });
  TestValidator.equals(
    "a 3 degree snap is below the 5 degree limit",
    read(small).turn.value,
    0,
  );
  const tight: AutoMovieMotionHumanAuditSpin.IResult = read(small, 1);
  TestValidator.predicate(
    `a limit of 1 reads the 3 degree snap, got ${show(tight)}`,
    Math.abs(tight.turn.value - 3) <= 1e-6 && tight.turn.where === "jaw",
  );

  // 6. A smooth start.
  const smooth: AutoMovieMotionHumanAuditSpin.IResult = read(
    (t: number): Angles => ({ head: t > 0.5 ? 3000 * (t - 0.5) ** 2 : 0 }),
  );
  TestValidator.predicate(
    `a smooth start is no snap, got ${show(smooth)}`,
    smooth.turn.value === 0 && smooth.spin.value > 100,
  );

  // 7. Two snaps at once.
  const both: AutoMovieMotionHumanAuditSpin.IResult = read(
    (t: number): Angles => ({
      jaw: snap(t, 0.4321, 10),
      rightToes: snap(t, 0.4321, 25),
    }),
  );
  TestValidator.predicate(
    `the worse of two snaps is reported, got ${show(both)}`,
    Math.abs(both.turn.value - 25) <= 1e-6 && both.turn.where === "rightToes",
  );

  // 8. A bad rate.
  TestValidator.error("a rate of zero is refused", (): void => {
    read((): Angles => ({ head: 0 }), 5, 0);
  });
}
