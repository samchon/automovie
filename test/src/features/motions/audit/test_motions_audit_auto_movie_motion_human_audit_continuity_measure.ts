import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditContinuity,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditContinuity } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few differences, metres and metres per second. */
const ROUNDING: number = 1e-9;

/** The hand's steady speed, metres per second. */
const SPEED: number = 0.5;

/** The size of the hand's step and of its one-frame spike, metres. */
const STEP: number = 0.1;

/** The spike's height, metres. */
const SPIKE: number = 0.05;

/**
 * The bound on what a step's last interval adds to it, metres: the steady speed
 * over the finest interval, `1 / (24 * 4^5)` s, rounded up.
 */
const FINEST: number = 1e-4;

/** The step riding on the fast turn, metres. */
const CIRCLED: number = 0.02;

/**
 * What the fast turn adds over the finest interval, metres: 4 pi m/s over `1 /
 * (24 * 4^5)` s, rounded up.
 */
const CIRCLING: number = 1e-3;

/**
 * `AutoMovieMotionHumanAuditContinuity.measure` reads a joint centre's path:
 * `speed`, the fastest it travels relative to the hips over a grid interval;
 * `jump`, the displacement still there once a departing interval is quartered
 * five times; `reversal`, an out-and-back within two frames, the shorter
 * displacement times the cosine of their opposition.
 *
 * Scenarios, the hips still at (0, 1, 0) and the left hand sliding along x at
 * 0.5 m/s for 2 s, read at 24 Hz:
 *
 * 1. The steady hand reads its speed, 0.5 m/s, no jump and no reversal; carried
 *    with the hips at the same speed, its speed is 0.
 * 2. A hand that steps 0.1 m at 1.01 s jumps 0.1 m, within the step's last
 *    interval of a tenth of a millimetre, in the grid interval from 1 s.
 * 3. A hand that spikes 0.05 m at exactly 1 s goes out by `0.05 + d` and back by
 *    `0.05 - d`, `d = 0.5 / 24` the steady frame's travel: a reversal of `0.05
 *
 *    - D` at 1 s, read on the grid's own frames since it is as fine as a reversal's.
 * 4. A hand circling 1 m out at two turns a second (12.6 m/s) displaced 20 mm for
 *    one frame from 1.01 s jumps 20 mm, within what the turn adds over the last
 *    interval; the fast turn alone is not chased and jumps nothing.
 * 5. A hand swaying 0.3 m at 1 Hz departs from the quadratic predictor by its
 *    fourth derivative, `0.3 (2 pi)^4 / 24^4`, under the 5 mm limit: no jump.
 */
export function test_motions_audit_auto_movie_motion_human_audit_continuity_measure(): void {
  const place = (
    name: AutoMovieHumanoidBone,
    at: IAutoMovieVector3,
  ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
    name,
    {
      bone: name,
      localRotation: Quaternion.identity(),
      worldPosition: at,
      worldRotation: Quaternion.identity(),
    },
  ];
  const motion = (
    hand: (t: number) => number,
    hips: (t: number) => number = () => 0,
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 2,
    segments: () => [],
    bones: (_subject: string, t: number) =>
      new Map([
        place("hips", { x: hips(t), y: 1, z: 0 }),
        place("leftHand", { x: hand(t), y: 1, z: 0.3 }),
      ]),
  });
  const steady: IAutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(
      motion((t: number): number => SPEED * t),
      "a",
    );
  TestValidator.predicate(
    "a steady hand",
    nclose(steady.speed.value, SPEED, ROUNDING) &&
      steady.speed.where === "leftHand" &&
      steady.jump.value === 0 &&
      steady.reversal.value === 0,
  );
  TestValidator.predicate(
    "carried with the hips",
    nclose(
      AutoMovieMotionHumanAuditContinuity.measure(
        motion(
          (t: number): number => SPEED * t,
          (t: number): number => SPEED * t,
        ),
        "a",
      ).speed.value,
      0,
      ROUNDING,
    ),
  );
  const stepped: IAutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(
      motion((t: number): number => SPEED * t + (t >= 1.01 ? STEP : 0)),
      "a",
    );
  TestValidator.predicate(
    "a step",
    stepped.jump.value >= STEP &&
      stepped.jump.value <= STEP + FINEST &&
      stepped.jump.where === "leftHand" &&
      stepped.jump.seconds >= 1 &&
      stepped.jump.seconds <= 1.01,
  );
  const spiked: IAutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(
      motion(
        (t: number): number =>
          SPEED * t + (Math.abs(t - 1) < 1e-12 ? SPIKE : 0),
      ),
      "a",
    );
  TestValidator.predicate(
    "a spike",
    nclose(spiked.reversal.value, SPIKE - SPEED / 24, ROUNDING) &&
      nclose(spiked.reversal.seconds, 1, ROUNDING) &&
      spiked.reversal.where === "leftHand",
  );
  const circling = (step: number): IAutoMovieMotionHumanAuditMotion => ({
    duration: 2,
    segments: () => [],
    bones: (_subject: string, t: number) => {
      const angle: number = 2 * 2 * Math.PI * t;
      const off: number = t >= 1.01 && t < 1.01 + 1 / 24 ? step : 0;
      return new Map([
        place("hips", { x: 0, y: 1, z: 0 }),
        place("leftHand", {
          x: Math.cos(angle) + off,
          y: 1,
          z: Math.sin(angle),
        }),
      ]);
    },
  });
  const turning: IAutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(circling(CIRCLED), "a");
  TestValidator.predicate(
    "a step on a fast turn",
    turning.jump.value >= CIRCLED &&
      turning.jump.value <= CIRCLED + CIRCLING &&
      AutoMovieMotionHumanAuditContinuity.measure(circling(0), "a").jump
        .value === 0,
  );
  TestValidator.equals(
    "a smooth sway",
    AutoMovieMotionHumanAuditContinuity.measure(
      motion((t: number): number => 0.3 * Math.sin(2 * Math.PI * t)),
      "a",
    ).jump.value,
    0,
  );
}
