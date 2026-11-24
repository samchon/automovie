import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { prepareHumanPostureCorrection } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a quintic's evaluation, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `prepareHumanPostureCorrection` solves a balance correction only at its knots
 * and courses what it changes: `knots` are the window's ends, its ramps' ends,
 * its phase's bounds and each event inside it, with the middle of each interval
 * between two of them; a read adds the course's change to the posture it is
 * given inside the window and leaves it outside.
 *
 * Scenarios, a window from 1 to 3 s with 0.5 s ramps and an event at 2.2 s, the
 * correction moving the root 0.1 m along +X and bending the spine 5 degrees, on
 * an upstream posture standing still:
 *
 * 1. The knots are 1, 1.25, 1.5, 1.85, 2.2, 2.35, 2.5, 2.75 and 3.
 * 2. At each knot the read is the exact correction: the root 0.1 m over and the
 *    spine at 5 degrees.
 * 3. Before 1 s and after 3 s the posture is left as given.
 * 4. A joint the correction leaves as it was is not written.
 */
export function test_unit_motions_compose_prepare_human_posture_correction(): void {
  const window: IAutoMovieMotionHumanBalance.IWindow = {
    by: "hips",
    weight: 1,
    from: 1,
    to: 3,
    ramp: { in: 0.5, out: 0.5 },
  };
  const knots: number[] = prepareHumanPostureCorrection.knots(
    window,
    [2.2, 0.5],
  );
  TestValidator.predicate(
    "the knots",
    knots.length === 9 &&
      [1, 1.25, 1.5, 1.85, 2.2, 2.35, 2.5, 2.75, 3].every(
        (t: number, i: number): boolean => nclose(knots[i]!, t, ROUNDING),
      ),
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
    );

  // 2. Exact at the knots.
  TestValidator.predicate(
    "exact at the knots",
    knots.every((t: number): boolean => {
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
}
