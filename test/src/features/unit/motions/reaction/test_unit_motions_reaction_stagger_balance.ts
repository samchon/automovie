import type { IAutoMovieVector3 } from "@automovie/interface";
import { staggerNearest, staggerShift } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** A unit square base of support on the floor. */
const SQUARE: readonly IAutoMovieVector3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 1, y: 0, z: 1 },
  { x: 0, y: 0, z: 1 },
];

/**
 * A stagger's balance helpers: `staggerShift` sums the series of residuals the
 * planted legs leave (a geometric series where the second residual is a share
 * of the first), and `staggerNearest` keeps a point inside the bearing feet's
 * outline, else moves it to the outline's nearest point.
 *
 * Scenarios:
 *
 * 1. A second residual a quarter of the first sums to the first over three
 *    quarters, on each level axis, with no height.
 * 2. A second residual of the opposite sign, or beyond the series' share, is added
 *    as it is.
 * 3. A point inside the square stays; one beyond its edge goes to the edge, beyond
 *    a corner to the corner; the prepared reader agrees.
 */
export function test_unit_motions_reaction_stagger_balance(): void {
  // 1. The series.
  TestValidator.predicate(
    "a quarter share sums geometrically",
    vclose(
      staggerShift({ x: 0.04, y: 1, z: -0.08 }, { x: 0.01, y: 1, z: -0.02 }),
      { x: 0.04 / 0.75, y: 0, z: -0.08 / 0.75 },
      1e-12,
    ),
  );

  // 2. Added as it is.
  TestValidator.predicate(
    "an opposite or large second residual is added",
    vclose(
      staggerShift({ x: 0.04, y: 0, z: 0.04 }, { x: -0.01, y: 0, z: 0.03 }),
      { x: 0.03, y: 0, z: 0.07 },
      1e-12,
    ),
  );

  // 3. The outline.
  const nearest: (point: IAutoMovieVector3) => IAutoMovieVector3 =
    staggerNearest.prepare(SQUARE);
  const inside: IAutoMovieVector3 = { x: 0.3, y: 0, z: 0.6 };
  TestValidator.predicate(
    "inside stays, outside goes to the edge or the corner",
    vclose(staggerNearest(SQUARE, inside), inside, 1e-12) &&
      vclose(
        staggerNearest(SQUARE, { x: 0.5, y: 0, z: -2 }),
        {
          x: 0.5,
          y: 0,
          z: 0,
        },
        1e-12,
      ) &&
      vclose(
        staggerNearest(SQUARE, { x: 3, y: 0, z: 3 }),
        {
          x: 1,
          y: 0,
          z: 1,
        },
        1e-12,
      ) &&
      vclose(nearest({ x: 3, y: 0, z: 3 }), { x: 1, y: 0, z: 1 }, 1e-12),
  );
}
