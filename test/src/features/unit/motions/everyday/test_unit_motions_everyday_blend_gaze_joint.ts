import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { blendGazeJoint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one product and sum per angle, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `blendGazeJoint` moves one joint's three clinical angles from the record's
 * own, zero where it holds none, toward the gaze's asked angles by the weight,
 * writing the record in place.
 *
 * Scenarios:
 *
 * 1. A neck at (10, -4, 20) blended a quarter of the way toward (30, 4, -20) is at
 *    (15, -2, 10).
 * 2. A head the record leaves out blends from zero: half way toward (8, 6, -2) is
 *    (4, 3, -1).
 * 3. Weight 0 leaves the angles and 1 takes the asked ones.
 */
export function test_unit_motions_everyday_blend_gaze_joint(): void {
  const joints: IAutoMovieMotionHumanPosture["joints"] = { neck: [10, -4, 20] };
  const close = (
    angles: readonly [number, number, number] | undefined,
    expected: readonly [number, number, number],
  ): boolean =>
    angles !== undefined &&
    angles.every((v: number, i: number): boolean =>
      nclose(v, expected[i]!, ROUNDING),
    );

  // 1. A quarter of the way.
  blendGazeJoint(joints, "neck", 30, 4, -20, 0.25);
  TestValidator.predicate(
    "a quarter of the way",
    close(joints.neck, [15, -2, 10]),
  );

  // 2. From zero.
  blendGazeJoint(joints, "head", 8, 6, -2, 0.5);
  TestValidator.predicate("from zero", close(joints.head, [4, 3, -1]));

  // 3. The weight's ends.
  blendGazeJoint(joints, "head", 100, 100, 100, 0);
  TestValidator.predicate("weight 0", close(joints.head, [4, 3, -1]));
  blendGazeJoint(joints, "head", 8, 6, -2, 1);
  TestValidator.predicate("weight 1", close(joints.head, [8, 6, -2]));
}
