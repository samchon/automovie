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

/** Half a millimetre, a hundredth of a degree, a frame. */
const REQUIREMENT: prepareHumanPostureCorrection.IRequirement = {
  root: 5e-4,
  angle: 0.01,
  step: 1 / 30,
};

/** A window from 1 to 3 s, its ramps half a second, its phase 1.8 to 2.4 s. */
const WINDOW: IAutoMovieMotionHumanBalance.IWindow = {
  by: "hips",
  weight: 1,
  from: 1,
  to: 3,
  ramp: { in: 0.5, out: 0.5 },
  phase: { from: 1.8, to: 2.4 },
};

/** The uncorrected posture: standing, its spine unset. */
const STILL: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * `prepareHumanPostureCorrection` courses the change a correction makes, not
 * the corrected posture: a read adds the change at its second to the posture it
 * is given, so a posture other than the one corrected keeps its own values and
 * takes the change on top, a joint the uncorrected posture leaves out changing
 * from zero. Its forced knots are the ramps' ends, the phase's bounds and the
 * events strictly inside the window, sorted and distinct.
 *
 * Scenarios:
 *
 * 1. With the phase and events at 2.4, 3.2 and 1 s, the forced knots are 1.5, 1.8,
 *    2.4 and 2.5: 2.4 once, 3.2 past the window and 1 at its edge dropped.
 * 2. A correction lifting the root 5 cm, turning the heading 2 degrees and bending
 *    the unset spine to 5 degrees, read on a posture at x = 7 m, heading 30 and
 *    spine (10, 1, 0): x stays 7, the root rises 5 cm to 0.95 m, the heading
 *    reads 32 and the spine (15, 1, 0), at every tenth of a second in the
 *    window.
 */
export function test_motions_compose_posture_correction_change(): void {
  // 1. The forced knots.
  TestValidator.equals(
    "the forced knots",
    prepareHumanPostureCorrection.marks(WINDOW, [2.4, 3.2, 1]),
    [1.5, 1.8, 2.4, 2.5],
  );

  // 2. The change, on another posture.
  const read: ReturnType<typeof prepareHumanPostureCorrection> =
    prepareHumanPostureCorrection(
      (): IAutoMovieMotionHumanPosture => STILL,
      WINDOW,
      [],
      (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        root: { ...posture.root, y: posture.root.y + 0.05 },
        yaw: posture.yaw + 2,
        joints: { ...posture.joints, spine: [5, 0, 0] },
      }),
      REQUIREMENT,
    );
  const moving: IAutoMovieMotionHumanPosture = {
    ...STILL,
    root: { x: 7, y: 0.9, z: 0 },
    yaw: 30,
    joints: { spine: [10, 1, 0] },
  };
  TestValidator.predicate(
    "the change is added to the posture read",
    Array.from(
      { length: 21 },
      (_: unknown, i: number): number => 1 + i / 10,
    ).every((t: number): boolean => {
      const p: IAutoMovieMotionHumanPosture = read(moving, t);
      return (
        nclose(p.root.x, 7, ROUNDING) &&
        nclose(p.root.y, 0.95, ROUNDING) &&
        nclose(p.yaw, 32, ROUNDING) &&
        nclose(p.joints.spine![0], 15, ROUNDING) &&
        nclose(p.joints.spine![1], 1, ROUNDING) &&
        nclose(p.joints.spine![2], 0, ROUNDING)
      );
    }),
  );
}
