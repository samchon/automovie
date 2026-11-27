import { AutoMovieEngineFluid } from "@automovie/engine";
import type { IAutoMovieFluidBudget } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { fluidDomain } from "../../internal/fluidFixtures";

/**
 * `fluidDomainBudget` counts a staggered grid's cells and faces: C × R cells,
 * (C + 1) R + C (R + 1) faces, eight bytes per depth or face velocity, and
 * cells × maxSteps worst-case updates.
 *
 * Scenarios:
 *
 * 1. A 2 × 1 grid: 2 cells, 3 + 4 = 7 faces, 72 bytes, 2000 updates over 1000
 *    steps, no spray.
 */
export function test_engine_fluid_domain_budget(): void {
  const budget: IAutoMovieFluidBudget = AutoMovieEngineFluid.fluidDomainBudget(fluidDomain());
  TestValidator.equals(
    "the 2 x 1 grid's counts",
    [
      budget.domain,
      budget.cells,
      budget.faces,
      budget.stateBytes,
      budget.maxSteps,
      budget.worstCaseCellUpdates,
      budget.sprayParticleCap,
    ],
    ["pond", 2, 7, 72, 1000, 2000, 0],
  );
}
