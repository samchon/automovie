import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditSpin,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditSpin
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditSpin";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few quaternion products, degrees and degrees per second. */
const ROUNDING: number = 1e-6;

/** The head's steady turn, degrees per second. */
const RATE: number = 90;

/** The snap, degrees. */
const SNAP: number = 20;

/**
 * What the steady turn adds over the finest interval, degrees: 90 deg/s over `1
 * / (24 * 2^10)` s, rounded up.
 */
const FINEST: number = 0.005;

/**
 * `AutoMovieMotionHumanAuditSpin.measure` reads how bones turn: `spin`, the
 * fastest turn over a grid interval, degrees per second; `turn`, the turn still
 * there once an interval that turns more than its neighbours by the limit is
 * halved ten times, which a snap keeps and a smooth turn does not.
 *
 * Scenarios, the head turning about the vertical at 90 deg/s for 2 s, read at
 * 24 Hz:
 *
 * 1. The steady turn spins at 90 deg/s and leaves no turn.
 * 2. A 20 degree snap at 1.01 s turns 20 degrees, plus at most the steady turn
 *    over the last interval, from within the grid interval that holds it; its
 *    spin is that interval's turn over its length, `90 + 20 * 24`.
 * 3. The steady turn with its quaternion negated from 1 s, the same rotation (the
 *    double cover), still spins at 90 deg/s and leaves no turn.
 * 4. A spin that speeds up smoothly, `30 t^2` degrees, leaves no turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names steady speed, an angular snap, an antipodal quaternion representation and smooth acceleration.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditSpin.measure with analytic quaternion readers and samples a step, a continuous turn and a sign-flipped representation of the same turn.
 * @evidence contracts/development/testing.md#independent-expectations At 24 Hz, a snapped frame adds 20×24 degrees per second to the 90-degree base rate. The localized turn retains 20 degrees plus only steady motion in the final subdivision. Negating a quaternion preserves its rotation.
 */
export function test_motions_audit_auto_movie_motion_human_audit_spin_measure(): void {
  const motion = (
    angle: (t: number) => number,
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 2,
    segments: () => [],
    bones: (_subject: string, t: number) => {
      const turn = AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, angle(t));
      return new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
        [
          "head",
          {
            bone: "head",
            localRotation: turn,
            worldPosition: { x: 0, y: 1.6, z: 0 },
            worldRotation: turn,
          },
        ],
      ]);
    },
  });
  const steady: IAutoMovieMotionHumanAuditSpin.IResult =
    AutoMovieMotionHumanAuditSpin.measure(
      motion((t: number): number => RATE * t),
      "a",
    );
  TestValidator.predicate(
    "a steady turn",
    nclose(steady.spin.value, RATE, ROUNDING) &&
      steady.spin.where === "head" &&
      steady.turn.value === 0,
  );
  const snapped: IAutoMovieMotionHumanAuditSpin.IResult =
    AutoMovieMotionHumanAuditSpin.measure(
      motion((t: number): number => RATE * t + (t >= 1.01 ? SNAP : 0)),
      "a",
    );
  TestValidator.predicate(
    "a snap",
    snapped.turn.value >= SNAP &&
      snapped.turn.value <= SNAP + FINEST &&
      snapped.turn.where === "head" &&
      snapped.turn.seconds >= 1 &&
      snapped.turn.seconds <= 1.01 &&
      nclose(snapped.spin.value, RATE + SNAP * 24, ROUNDING),
  );
  const antipodal: IAutoMovieMotionHumanAuditSpin.IResult =
    AutoMovieMotionHumanAuditSpin.measure(
      {
        duration: 2,
        segments: () => [],
        bones: (subject: string, t: number) => {
          const bones = motion((s: number): number => RATE * s).bones(
            subject,
            t,
          );
          const head: IAutoMovieResolvedBone = bones.get("head")!;
          const q = head.worldRotation;
          const flipped = t >= 1 ? { x: -q.x, y: -q.y, z: -q.z, w: -q.w } : q;
          return new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
            [
              "head",
              { ...head, localRotation: flipped, worldRotation: flipped },
            ],
          ]);
        },
      },
      "a",
    );
  TestValidator.predicate(
    "an antipodal representation",
    nclose(antipodal.spin.value, RATE, ROUNDING) && antipodal.turn.value === 0,
  );
  TestValidator.equals(
    "a smooth speed-up",
    AutoMovieMotionHumanAuditSpin.measure(
      motion((t: number): number => 30 * t * t),
      "a",
    ).turn.value,
    0,
  );
}
