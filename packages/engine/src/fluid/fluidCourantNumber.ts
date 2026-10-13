import { IAutoMovieFluidDomain } from "@automovie/interface";

/**
 * The Courant number of the domain's gravity wave:
 * `dt·√(g·H)·√(1/dx² + 1/dz²)`, with `H` the solver's design
 * `referenceDepth`.
 *
 * At most `1` for a stable explicit solve. It is the single number that says
 * whether the authored step, cell size, gravity and design depth can be
 * integrated at all, which is why the validator reads it instead of guessing
 * a step on the author's behalf, and why the budget report carries it. It is
 * `NaN` when an input is not a real number and may overflow to `Infinity` for
 * extreme finite inputs; `validateFluidDomain` names the first case at its
 * field and refuses the second as unstable.
 *
 * @evidence contracts/common.md#principled-implementation The two-dimensional CFL bound for an explicit gravity-wave scheme on a rectangular grid, with wave speed `sqrt(g·H)` evaluated at the declared design depth, which the validator also caps every initial depth by so the bound covers the deepest authored water.
 * @evidence contracts/common.md#clear-and-simple-design One expression shared by `validateFluidDomain` and `fluidDomainBudget`, so the refusal and the reported number cannot disagree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No step is suggested or substituted; the number is reported as computed, including its non-finite outcomes, and the caller decides.
 * @evidence contracts/common.md#meaningful-documentation States the formula and which depth it uses, the stability threshold, both consumers, and what non-finite results mean.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A constant-time closed form with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A few multiplications per call; the validator and the budget each compute it once per domain.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads five domain fields and returns one number, retaining no reference to the domain.
 */
export const fluidCourantNumber = (domain: IAutoMovieFluidDomain): number =>
  domain.solver.fixedStepSeconds *
  Math.sqrt(domain.solver.gravity * domain.solver.referenceDepth) *
  Math.sqrt(
    1 / (domain.grid.cellX * domain.grid.cellX) +
      1 / (domain.grid.cellZ * domain.grid.cellZ),
  );
