import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A 0.2 m square base on the floor about the origin. */
const SQUARE: IAutoMovieVector3[] = [
  { x: -0.1, y: 0, z: -0.1 },
  { x: 0.1, y: 0, z: -0.1 },
  { x: 0.1, y: 0, z: 0.1 },
  { x: -0.1, y: 0, z: 0.1 },
];

/**
 * `HumanForceExchange.edge` is how far a centre's floor point travels along a
 * horizontal direction before it leaves the convex hull of the support points.
 *
 * Scenarios:
 *
 * 1. From the middle of a 0.2 m square, the edge lies 0.1 m ahead, whatever the
 *    centre's height.
 * 2. Along the diagonal it lies at the corner, `0.1 sqrt(2)` m.
 * 3. From 0.05 m toward +X, the +X edge is 0.05 m away.
 * 4. A centre already outside the base, or a base of two points, gives none.
 */
export function test_unit_motions_grappling_force_exchange_edge(): void {
  const diagonal: IAutoMovieVector3 = { x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 };
  TestValidator.predicate(
    "the hull's extent along the direction",
    nclose(
      HumanForceExchange.edge({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, SQUARE),
      0.1,
      1e-12,
    ) &&
      nclose(
        HumanForceExchange.edge({ x: 0, y: 1, z: 0 }, diagonal, SQUARE),
        0.1 * Math.SQRT2,
        1e-12,
      ) &&
      nclose(
        HumanForceExchange.edge(
          { x: 0.05, y: 1, z: 0 },
          { x: 1, y: 0, z: 0 },
          SQUARE,
        ),
        0.05,
        1e-12,
      ) &&
      HumanForceExchange.edge(
        { x: 0.2, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
        SQUARE,
      ) === 0 &&
      HumanForceExchange.edge(
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
        SQUARE.slice(0, 2),
      ) === 0,
  );
}
