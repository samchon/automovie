import { IAutoMovieFluidDomain } from "@automovie/interface";

/**
 * The Courant number of the domain's gravity wave: `dt·√(g·H)·√(1/dx² +
 * 1/dz²)`.
 *
 * At most `1` for a stable explicit solve. It is the single number that says
 * whether the authored step, cell size, gravity and design depth can be
 * integrated at all, which is why the validator reads it instead of guessing a
 * step on the author's behalf.
 *
 * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-refusal Measures whether the authored explicit solve is numerically admissible.
 * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#world-coupling-invalidation-and-refusal Supplies the stability fact used to refuse an invalid fluid domain.
 * @author Samchon
 */
export const fluidCourantNumber = (domain: IAutoMovieFluidDomain): number =>
  domain.solver.fixedStepSeconds *
  Math.sqrt(domain.solver.gravity * domain.solver.referenceDepth) *
  Math.sqrt(
    1 / (domain.grid.cellX * domain.grid.cellX) +
      1 / (domain.grid.cellZ * domain.grid.cellZ),
  );
