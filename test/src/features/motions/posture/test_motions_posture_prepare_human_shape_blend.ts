import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { prepareHumanShapeBlend } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one product and sum per angle, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `prepareHumanShapeBlend` blends two clinical joint maps linearly, each axis
 * at `a + (b - a) w`, over every bone either names, a bone a map leaves out
 * read as zero, the weight unclamped.
 *
 * Scenarios:
 *
 * 1. Weight 0 gives the first map and 1 the second.
 * 2. At 0.25 a joint from (0, 10, -20) to (40, 30, 20) is at (10, 15, -10).
 * 3. A bone only the second map names blends from zero; one only the first names
 *    blends to zero.
 * 4. The weight is not clipped: 1.5 extrapolates.
 */
export function test_motions_posture_prepare_human_shape_blend(): void {
  const blend: (weight: number) => IAutoMovieMotionHumanPosture["joints"] =
    prepareHumanShapeBlend(
      { leftIndexProximal: [0, 10, -20], leftThumbProximal: [8, 0, 0] },
      { leftIndexProximal: [40, 30, 20], leftMiddleProximal: [60, 0, 0] },
    );
  const close = (
    angles: readonly [number, number, number] | undefined,
    expected: readonly [number, number, number],
  ): boolean =>
    angles !== undefined &&
    angles.every((v: number, i: number): boolean =>
      nclose(v, expected[i]!, ROUNDING),
    );

  // 1. The ends.
  TestValidator.predicate(
    "the first map",
    close(blend(0).leftIndexProximal, [0, 10, -20]),
  );
  TestValidator.predicate(
    "the second map",
    close(blend(1).leftIndexProximal, [40, 30, 20]),
  );

  // 2. A quarter.
  TestValidator.predicate(
    "a quarter",
    close(blend(0.25).leftIndexProximal, [10, 15, -10]),
  );

  // 3. Bones one map leaves out.
  TestValidator.predicate(
    "from zero",
    close(blend(0.5).leftMiddleProximal, [30, 0, 0]),
  );
  TestValidator.predicate(
    "to zero",
    close(blend(0.5).leftThumbProximal, [4, 0, 0]),
  );

  // 4. Unclipped.
  TestValidator.predicate(
    "extrapolated",
    close(blend(1.5).leftIndexProximal, [60, 40, 40]),
  );
}
