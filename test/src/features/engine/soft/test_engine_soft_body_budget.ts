import { AutoMovieEngineSoftBody } from "@automovie/engine";
import type { IAutoMovieSoftBodyBudget } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../../internal/softFixtures";

/**
 * `softBodyBudget` counts a C × R cloth lattice's constraints (Provot 1995's
 * structural, shear and bend springs): structural (C−1)R + C(R−1), shear
 * 2(C−1)(R−1), bend (C−2)R + C(R−2), triangles 2(C−1)(R−1), and two xyz state
 * arrays of 8-byte numbers.
 *
 * Scenarios:
 *
 * 1. A 3 × 3 panel: 9 particles, 12 structural, 8 shear, 6 bend, 8 triangles, 432
 *    bytes; with 2 iterations over 1000 steps the gathers are 2·26·2·1000 =
 *    104000.
 * 2. A 2 × 2 panel has no bend constraint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses AutoMovieEngineSoftBody.softBodyBudget on 3-by-3 and 2-by-2 authored panels and checks the first panel's topology and report counts plus the second panel's absence of bend edges.
 * @evidence contracts/development/testing.md#independent-expectations A 3-by-3 grid has nine particles, six horizontal plus six vertical structural edges, eight quad diagonals, six bend edges and eight triangles. Two XYZ arrays occupy 432 bytes. Two ends per 26 constraints across two sweeps and 1,000 steps give 104,000 gathers.
 * @evidence contracts/development/common.md#meaningful-documentation The larger panel exercises structural, shear and bend counts, mesh size, state bytes and the zero-contact budget. A 2-by-2 grid exercises a lattice too narrow for bends.
 */
export function test_engine_soft_body_budget(): void {
  const budget: IAutoMovieSoftBodyBudget = AutoMovieEngineSoftBody.softBodyBudget(
    softPanel({ columns: 3, rows: 3 }),
  );
  TestValidator.equals(
    "the 3 x 3 counts",
    [
      budget.particles,
      budget.structural,
      budget.shear,
      budget.bend,
      budget.triangles,
      budget.stateBytes,
      budget.worstCaseGathers,
      budget.worstCaseSelfContactPairs,
    ],
    [9, 12, 8, 6, 8, 432, 104000, 0],
  );
  TestValidator.equals(
    "a 2 x 2 panel bends nowhere",
    AutoMovieEngineSoftBody.softBodyBudget(softPanel({ columns: 2, rows: 2 })).bend,
    0,
  );
}
