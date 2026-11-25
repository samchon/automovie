import { IAutoMovieFluidDomain } from "@automovie/interface";

/**
 * The domain's gravity-wave Courant expression `dt * sqrt(g * H) * sqrt(1/dx² +
 * 1/dz²)`, with H the solver's design referenceDepth.
 *
 * `validateFluidDomain` compares this number with `1` at the declared design
 * depth, and `fluidDomainBudget` reports it without admission. Initial depth is
 * checked against that design depth, but later inflow can exceed it without
 * another Courant check.
 *
 * Direct binary64 products and reciprocals can underflow or overflow, yielding
 * zero, `Infinity` or `NaN` even for positive finite inputs. The validator
 * rejects a result above one, including `Infinity`, but its comparison misses
 * `NaN`; this number alone is not a certificate of a stable solve.
 */
export const fluidCourantNumber: (domain: IAutoMovieFluidDomain) => number = (
  domain: IAutoMovieFluidDomain,
): number =>
  domain.solver.fixedStepSeconds *
  Math.sqrt(domain.solver.gravity * domain.solver.referenceDepth) *
  Math.sqrt(
    1 / (domain.grid.cellX * domain.grid.cellX) +
      1 / (domain.grid.cellZ * domain.grid.cellZ),
  );
