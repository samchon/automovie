import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  prepareHumanPostureCorrection
} from "../../../../../packages/motions/src/compose/internal/prepareHumanPostureCorrection";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a quintic's evaluation, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * A balance correction's requirement: half a millimetre, a hundredth of a
 * degree, a frame.
 */
const REQUIREMENT: prepareHumanPostureCorrection.IRequirement = {
  root: 5e-4,
  angle: 0.01,
  step: 1 / 30,
};

/**
 * `prepareHumanPostureCorrection` solves a balance correction only at the knots
 * AutoKnots places to the caller's requirement and courses what it changes:
 * `marks`, the window's ramps' ends, its phase's bounds and each event inside
 * it, are forced knots; a read adds the course's change to the posture it is
 * given inside the window and leaves it outside.
 *
 * Scenarios, a window from 1 to 3 s with 0.5 s ramps and an event at 2.2 s, on
 * an upstream posture standing still:
 *
 * 1. The forced knots are 1.5, 2.2 and 2.5; the event at 0.5 s, outside the
 *    window, is not one, nor are the window's own ends.
 * 2. A correction moving the root 0.1 m along +X and bending the spine 5 degrees
 *    throughout is read exactly at every second inside the window.
 * 3. Before 1 s and after 3 s the posture is left as given.
 * 4. A joint the correction leaves as it was is not written.
 * 5. A correction moving the root `0.1 sin²(π (t − 1) / 2)` metres, at rest at the
 *    window's ends, is exact at the forced knots and within the requirement's
 *    half millimetre on a 1/120 s grid; it is solved at fewer seconds than that
 *    grid has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names forced knots, constant and smooth corrections, range identity, retained joints and the bounded adaptive solve count.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares direct correction callbacks on a small posture, reads them on a fixed 120 Hz grid and records the callback's solve seconds.
 * @evidence contracts/development/testing.md#independent-expectations The constant input fixes a 0.1 m translation and 5-degree spine value. The smooth input's sine-squared formula fixes its values at the forced marks and throughout the grid, within the prescribed half-millimetre bound.
 */
export function test_motions_compose_prepare_human_posture_correction(): void {
  const window: IAutoMovieMotionHumanBalance.IWindow = {
    by: "hips",
    weight: 1,
    from: 1,
    to: 3,
    ramp: { in: 0.5, out: 0.5 },
  };
  TestValidator.equals(
    "the forced knots",
    prepareHumanPostureCorrection.marks(window, [2.2, 0.5]),
    [1.5, 2.2, 2.5],
  );

  const still: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.9, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { neck: [3, 0, 0] },
    limbs: {},
  };
  const read: ReturnType<typeof prepareHumanPostureCorrection> =
    prepareHumanPostureCorrection(
      (): IAutoMovieMotionHumanPosture => still,
      window,
      [2.2],
      (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        root: { ...posture.root, x: posture.root.x + 0.1 },
        joints: { ...posture.joints, spine: [5, 0, 0], neck: [3, 0, 0] },
      }),
      REQUIREMENT,
    );
  const grid: number[] = Array.from(
    { length: 241 },
    (_: unknown, i: number): number => 1 + i / 120,
  );

  // 2. A constant correction, exact throughout.
  TestValidator.predicate(
    "a constant correction throughout",
    grid.every((t: number): boolean => {
      const p: IAutoMovieMotionHumanPosture = read(still, t);
      return (
        nclose(p.root.x, 0.1, ROUNDING) &&
        nclose(p.joints.spine![0], 5, ROUNDING) &&
        p.joints.neck![0] === 3
      );
    }),
  );

  // 3. Outside the window.
  TestValidator.predicate(
    "outside the window",
    read(still, 0.5) === still && read(still, 3.5) === still,
  );

  // 4. An unchanged joint.
  TestValidator.predicate(
    "an unchanged joint is not written",
    read(still, 2).joints.neck === still.joints.neck,
  );

  // 5. A smooth shift, to the requirement.
  const shift = (t: number): number =>
    0.1 * Math.sin((Math.PI * (t - 1)) / 2) ** 2;
  const solved: number[] = [];
  const smooth: ReturnType<typeof prepareHumanPostureCorrection> =
    prepareHumanPostureCorrection(
      (): IAutoMovieMotionHumanPosture => still,
      window,
      [2.2],
      (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
      ): IAutoMovieMotionHumanPosture => {
        solved.push(t);
        return { ...posture, root: { ...posture.root, x: shift(t) } };
      },
      REQUIREMENT,
    );
  TestValidator.predicate(
    "exact at the forced knots",
    [1.5, 2.2, 2.5].every((t: number): boolean =>
      nclose(smooth(still, t).root.x, shift(t), ROUNDING),
    ),
  );
  TestValidator.predicate(
    "within the requirement between them",
    grid.every(
      (t: number): boolean =>
        Math.abs(smooth(still, t).root.x - shift(t)) <= REQUIREMENT.root,
    ),
  );
  TestValidator.predicate(
    "solved at fewer seconds than the grid",
    solved.length < grid.length,
  );
}
