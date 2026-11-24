import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditSpin,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  AutoMovieMotionHumanAuditSpin,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../../../../features/internal/motionAuditPoints";

/**
 * A one-frame step riding on a fast smooth turn is still found, and the fast
 * smooth turn alone is not chased.
 *
 * Scenarios:
 * 1. A joint circling at two turns a second, one metre out, displaced by
 *    20 mm for one 24 Hz frame: the continuity audit reads a 20 mm jump.
 * 2. The same circle without the step reads no jump, at no more than three
 *    poses a grid interval beyond the grid's own.
 * 3. A head spinning at 720 degrees a second, snapped by 20 degrees for one
 *    frame: the spin audit reads a 20 degree turn; without the snap, none.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public continuity and spin measures on closed-form paths: a step or snap the quartering's Richardson test lost, or a smooth turn it chased to the leaf, fails a predicate.
 * @evidence contracts/development/testing.md#independent-expectations The step's 20 mm and the snap's 20 degrees are the inputs; a smooth path over the leaf interval (1/24/4^5 s) moves the joint by under 1 mm and the head by under 0.1 degree; three poses an interval is one quartering's.
 * @evidence contracts/development/testing.md#distinguishing-cases With and without the step and the snap, on a turn fast enough that its grid displacements depart from the grid's quadratic predictor.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operations directly in memory on hand-made motions, counting their pose reads.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario's path, its step and what is read.
 */
export function test_motion_dynamics_audit_rotation_step(): void {
  const omega: number = 4 * Math.PI;
  const start: number = 1.01;
  const end: number = start + 1 / 24;
  const circle = (stepped: boolean): ICounted => {
    let reads: number = 0;
    const base: IAutoMovieMotionHumanAuditMotion = motionAuditPoints(
      2,
      (
        t: number,
      ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> => ({
        rightHand: {
          x:
            Math.cos(omega * t) + (stepped && t >= start && t < end ? 0.02 : 0),
          y: 1 + Math.sin(omega * t),
          z: 0,
        },
      }),
    );
    const motion: IAutoMovieMotionHumanAuditMotion = {
      ...base,
      bones: (
        subject: string,
        seconds: number,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        reads += 1;
        return base.bones(subject, seconds);
      },
    };
    return { motion, reads: (): number => reads };
  };

  const stepped: ICounted = circle(true);
  const jump: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditContinuity.measure(
      stepped.motion,
      "a",
      24,
      0.005,
    ).jump;
  TestValidator.predicate(
    "the one-frame step on the fast turn is found",
    Math.abs(jump.value - 0.02) < 1e-3 && jump.where === "rightHand",
  );

  const smooth: ICounted = circle(false);
  const clean: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditContinuity.measure(
      smooth.motion,
      "a",
      24,
      0.005,
    ).jump;
  TestValidator.equals("the fast smooth turn reads no jump", clean.value, 0);
  TestValidator.predicate(
    "the fast smooth turn is quartered once at most",
    smooth.reads() <= 49 + 3 * 48,
  );

  const head = (snapped: boolean): IAutoMovieMotionHumanAuditMotion => ({
    duration: 2,
    segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [],
    bones: (
      _: string,
      t: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const degrees: number =
        720 * t + (snapped && t >= start && t < end ? 20 : 0);
      const half: number = (degrees * Math.PI) / 360;
      const rotation: IAutoMovieQuaternion = {
        x: 0,
        y: Math.sin(half),
        z: 0,
        w: Math.cos(half),
      };
      return new Map([
        [
          "head",
          {
            bone: "head",
            worldPosition: { x: 0, y: 1.6, z: 0 },
            localRotation: rotation,
            worldRotation: rotation,
          },
        ],
      ]);
    },
  });
  const snap: IAutoMovieMotionHumanAuditSpin.IResult =
    AutoMovieMotionHumanAuditSpin.measure(head(true), "a", 24, 5);
  TestValidator.predicate(
    "the one-frame snap on the fast spin is found",
    Math.abs(snap.turn.value - 20) < 0.1 && snap.turn.where === "head",
  );
  TestValidator.equals(
    "the fast smooth spin reads no snap",
    AutoMovieMotionHumanAuditSpin.measure(head(false), "a", 24, 5).turn.value,
    0,
  );
}

/** A hand-made motion with a count of the poses read from it. */
interface ICounted {
  /** The motion. */
  motion: IAutoMovieMotionHumanAuditMotion;

  /** How many poses have been read so far. */
  reads: () => number;
}
