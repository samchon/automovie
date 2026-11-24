import { softBodyBudget } from "@automovie/engine";
import type { IAutoMovieSoftBodyBudget } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../../../internal/softFixtures";

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
 */
export function test_unit_engine_soft_body_budget(): void {
  const budget: IAutoMovieSoftBodyBudget = softBodyBudget(
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
    softBodyBudget(softPanel({ columns: 2, rows: 2 })).bend,
    0,
  );
}
