import { fluidCourantNumber } from "@automovie/engine";
import type { IAutoMovieFluidDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { fluidDomain } from "../../internal/fluidFixtures";
import { nclose } from "../../internal/nclose";

/**
 * `fluidCourantNumber` is the gravity-wave Courant number of the shallow-water
 * equations, `dt √(g H) √(1/dx² + 1/dz²)` (Courant, Friedrichs and Lewy 1928),
 * with H the solver's reference depth.
 *
 * Scenarios:
 *
 * 1. Dt = 1/8 s, g = 8, H = 2, dx = dz = 1: (1/8)·4·√2 = √2/2.
 * 2. Halving dt halves the number.
 */
export function test_engine_fluid_courant_number(): void {
  const solver: IAutoMovieFluidDomain["solver"] = fluidDomain().solver;
  const domain: IAutoMovieFluidDomain = fluidDomain({
    solver: { ...solver, referenceDepth: 2 },
  });

  // 1. The worked number.
  TestValidator.predicate(
    "the worked Courant number",
    nclose(fluidCourantNumber(domain), Math.SQRT2 / 2, 1e-15),
  );

  // 2. Linear in the step.
  TestValidator.predicate(
    "half the step, half the number",
    nclose(
      fluidCourantNumber(
        fluidDomain({
          solver: { ...solver, referenceDepth: 2, fixedStepSeconds: 1 / 16 },
        }),
      ),
      Math.SQRT2 / 4,
      1e-15,
    ),
  );
}
