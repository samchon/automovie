import { AutoMovieEngineFluid } from "@automovie/engine";
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
 * 3. Adjacent ordinary steps below, on and above the limit retain their
 *    original rounded values.
 * 4. Tiny, huge and subnormal factors preserve finite Courant values when
 *    their scales cancel. The budget reports the same stabilized value.
 * 5. The final magnitude can be the smallest subnormal, zero or Infinity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public calculator and budget reporter on typed unit and extreme grids. Zero-tolerance comparisons pin the ordinary threshold; finite and endpoint checks witness direct product failures and final result limits.
 * @evidence contracts/development/testing.md#independent-expectations On the unit grid the wave speed is 4 m/s and the spatial factor is √2. Setting gravity and depth equal to the shortest cell side cancels the scale, leaving the directional factor between one and √2. The smallest and largest binary64 values supply the output bounds.
 * @evidence contracts/development/common.md#meaningful-documentation Unit-grid clock cases, cancelling extreme scales, subnormal inputs and final rounding bounds exercise the calculator. The budget reports each recovered value.
 */
export function test_engine_fluid_courant_number(): void {
  const solver: IAutoMovieFluidDomain["solver"] = fluidDomain().solver;
  const domain: IAutoMovieFluidDomain = fluidDomain({
    solver: { ...solver, referenceDepth: 2 },
  });

  // 1. The worked number.
  TestValidator.predicate(
    "the worked Courant number",
    nclose(AutoMovieEngineFluid.fluidCourantNumber(domain), Math.SQRT2 / 2, 1e-15),
  );

  // 2. Linear in the step.
  TestValidator.predicate(
    "half the step, half the number",
    nclose(
      AutoMovieEngineFluid.fluidCourantNumber(
        fluidDomain({
          solver: { ...solver, referenceDepth: 2, fixedStepSeconds: 1 / 16 },
        }),
      ),
      Math.SQRT2 / 4,
      1e-15,
    ),
  );

  // 3. Preserve the ordinary product order at the threshold.
  const onLimit: number = 1 / (4 * Math.SQRT2);
  for (const [fixedStepSeconds, expected] of [
    [onLimit - Number.EPSILON / 8, 1 - Number.EPSILON],
    [onLimit, 1],
    [onLimit + Number.EPSILON / 8, 1 + Number.EPSILON],
  ] as const)
    TestValidator.predicate(
      `the ordinary boundary at step ${fixedStepSeconds}`,
      nclose(
        AutoMovieEngineFluid.fluidCourantNumber({
          ...domain,
          solver: { ...domain.solver, fixedStepSeconds },
        }),
        expected,
        0,
      ),
    );

  // 4. Reciprocal spacing cancels extreme wave and clock scales.
  const smallest: number = Number.MIN_VALUE;
  const largest: number = Number.MAX_VALUE;
  for (const [title, dt, g, h, dx, dz, expected] of [
    ["narrow mixed grid", 2, 1e-200, 1e-200, 1e-200, 1, 2],
    ["wide square grid", 0.5, 1e200, 1e200, 1e200, 1e200, Math.SQRT2 / 2],
    ["subnormal operands", 0.5, smallest, smallest, smallest, smallest, Math.SQRT2 / 2],
    ["clock and wave product", largest, 4, 4, largest, largest, 4 * Math.SQRT2],
    ["gravity and depth product", 1 / 64, 1e200, 1e200, 1, 1, (1e200 * Math.SQRT2) / 64],
  ] as const) {
    const scaled: IAutoMovieFluidDomain = fluidDomain({
      grid: { ...domain.grid, cellX: dx, cellZ: dz },
      solver: { ...solver, fixedStepSeconds: dt, gravity: g, referenceDepth: h },
    });
    const tolerance: number = expected * 1e-15;
    TestValidator.predicate(
      title,
      nclose(AutoMovieEngineFluid.fluidCourantNumber(scaled), expected, tolerance) &&
        nclose(AutoMovieEngineFluid.fluidDomainBudget(scaled).courant, expected, tolerance),
    );
  }

  // 5. The final range may require subnormal rounding or saturate.
  for (const [title, dt, g, h, dx, dz, expected] of [
    ["smallest result", smallest, 1, 1, 1, largest, smallest],
    ["final underflow", smallest, 1, 1, largest, largest, 0],
    ["final overflow", largest, largest, largest, 1, 1, Infinity],
  ] as const)
    TestValidator.predicate(
      title,
      Object.is(
        AutoMovieEngineFluid.fluidCourantNumber(
          fluidDomain({
            grid: { ...domain.grid, cellX: dx, cellZ: dz },
            solver: { ...solver, fixedStepSeconds: dt, gravity: g, referenceDepth: h },
          }),
        ),
        expected,
      ),
    );
}
