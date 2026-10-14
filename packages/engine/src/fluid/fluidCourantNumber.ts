import { IAutoMovieFluidDomain } from "@automovie/interface";

/**
 * The domain's gravity-wave Courant expression `dt * sqrt(g * H) * sqrt(1/dx² + 1/dz²)`, with H the solver's design referenceDepth.
 *
 * `validateFluidDomain` compares this number with `1` at the declared design depth, and `fluidDomainBudget` reports it without admission. Initial depth is checked against that design depth, but later inflow can exceed it without another Courant check.
 *
 * Direct binary64 products and reciprocals can underflow or overflow, yielding zero, `Infinity` or `NaN` even for positive finite inputs. The validator rejects a result above one, including `Infinity`, but its comparison misses `NaN`; this number alone is not a certificate of a stable solve.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the rectangular-grid gravity-wave CFL expression at referenceDepth using direct products and reciprocals. Its numerical premise is representable intermediates; finite authored inputs do not establish that premise, and inflow is not constrained to the reference depth during integration.
 * @evidence contracts/common.md#clear-and-simple-design One expression shared by `validateFluidDomain` and `fluidDomainBudget`, so the refusal and the reported number cannot disagree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No step is suggested or substituted; the number is reported as computed, including its non-finite outcomes, and the caller decides.
 * @evidence contracts/common.md#meaningful-documentation States the formula, design-depth comparison and consumers, the lack of a later depth check, and the finite-input underflow/overflow and NaN-admission gaps.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A constant-time closed form with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A few multiplications per call; the validator and the budget each compute it once per domain.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads five domain fields and returns one number, retaining no reference to the domain.
 */
export const fluidCourantNumber: (domain: IAutoMovieFluidDomain) => number = (domain: IAutoMovieFluidDomain): number =>
  domain.solver.fixedStepSeconds *
  Math.sqrt(domain.solver.gravity * domain.solver.referenceDepth) *
  Math.sqrt(
    1 / (domain.grid.cellX * domain.grid.cellX) +
      1 / (domain.grid.cellZ * domain.grid.cellZ),
  );
