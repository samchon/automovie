import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few line intersections, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanBalance.along` is the margin of stability along one horizontal
 * direction (Hof et al. 2005): how far a point may move that way before it
 * leaves the convex hull of the support points, negative by the distance back
 * to the hull when it is outside; its height and the direction's length are
 * ignored.
 *
 * Scenarios, a 0.3 m square base from (0, 0) to (0.3, 0.3) on the floor:
 *
 * 1. From (0.1, 0.1) the margin is 0.2 m along +X, 0.1 m along -X and 0.2 m along
 *    +Z, the direction's length not counting.
 * 2. Along the diagonal (1, 1) it is the diagonal to the far corner, 0.2 sqrt 2.
 * 3. From (0.5, 0.1), outside, along -X it is the -0.5 m to the far edge's
 *    crossing, negative.
 */
export function test_unit_motions_everyday_human_balance_along(): void {
  const base: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 0.3, y: 0, z: 0 },
    { x: 0.3, y: 0, z: 0.3 },
    { x: 0, y: 0, z: 0.3 },
  ];
  const inside: IAutoMovieVector3 = { x: 0.1, y: 0.9, z: 0.1 };
  TestValidator.predicate(
    "inside",
    nclose(
      HumanBalance.along(inside, base, { x: 1, y: 0, z: 0 }),
      0.2,
      ROUNDING,
    ) &&
      nclose(
        HumanBalance.along(inside, base, { x: -2, y: 0, z: 0 }),
        0.1,
        ROUNDING,
      ) &&
      nclose(
        HumanBalance.along(inside, base, { x: 0, y: 0, z: 1 }),
        0.2,
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "diagonal",
    nclose(
      HumanBalance.along(inside, base, { x: 1, y: 0, z: 1 }),
      0.2 * Math.SQRT2,
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "outside",
    nclose(
      HumanBalance.along({ x: 0.5, y: 0, z: 0.1 }, base, { x: -1, y: 0, z: 0 }),
      -0.5,
      ROUNDING,
    ),
  );
}
