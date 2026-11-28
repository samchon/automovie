import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieSubjectBox } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `transformedBoxBounds` bounds a local box carried through a column-major
 * affine matrix.
 *
 * Scenarios:
 *
 * Box (0,0,0)-(1,2,3):
 *
 * 1. A translation by (10, 0, 0) gives (10,0,0)-(11,2,3).
 * 2. A quarter turn about z maps (x, y, z) to (-y, x, z): the bound is
 *    (-2,0,0)-(0,1,3).
 * 3. A scale of -1 on x still gives an ordered box (-1,0,0)-(0,2,3).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers ordering of transformed bounds under translation, a quarter turn and a mirror.
 * @evidence contracts/development/testing.md#behavioral-verification Calls transformedBoxBounds on the same local box with three explicit column-major matrices.
 * @evidence contracts/development/testing.md#independent-expectations Adding ten moves only the x interval. The quarter turn maps (x, y) to (-y, x). Mirroring x reverses its transformed corner order, giving the ordered interval [-1, 0].
 */
export function test_engine_math_transformed_box_bounds(): void {
  const box: IAutoMovieSubjectBox = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 2, z: 3 },
  };
  TestValidator.equals(
    "translation",
    AutoMovieEngineMath.transformedBoxBounds(
      box,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 0, 0, 1],
    ),
    { min: { x: 10, y: 0, z: 0 }, max: { x: 11, y: 2, z: 3 } },
  );
  TestValidator.equals(
    "quarter turn",
    AutoMovieEngineMath.transformedBoxBounds(
      box,
      [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    ),
    { min: { x: -2, y: 0, z: 0 }, max: { x: 0, y: 1, z: 3 } },
  );
  TestValidator.equals(
    "mirror",
    AutoMovieEngineMath.transformedBoxBounds(
      box,
      [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    ),
    { min: { x: -1, y: 0, z: 0 }, max: { x: 0, y: 2, z: 3 } },
  );
}
