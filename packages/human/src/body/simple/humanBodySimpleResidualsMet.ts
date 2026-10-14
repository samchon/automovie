import type { IHumanBodySimpleUnknown } from "./IHumanBodySimpleUnknown";

/**
 * Test relative solve residuals against each named measurement's absolute budget.
 *
 * The coupled solver defines r=(reading-target)/target for positive targets.
 * Multiplying r by that same target recovers the error in metres or kilograms,
 * so a millimetre tape budget cannot become a mass-relative percentage. The
 * solver supplies matching row counts and admitted targets/tolerances. Empty
 * systems are met; a nonfinite residual is not met. Inputs remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Multiplying each relative residual by its matching positive target restores the absolute measurement error before comparison with that row's budget.
 * @evidence contracts/common.md#clear-and-simple-design One short-circuit predicate owns acceptance; normalization belongs to the coupled adapter and row alignment remains a caller precondition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite residuals fail; no relative percentage substitutes for a tape's absolute tolerance and an empty system follows Array.every semantics.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the normalization, metre/kilogram recovery, matching-row premise, empty behavior and unchanged inputs.
 * @evidence contracts/performance.md#efficient-algorithms At most R rows are read once, stopping at the first miss, with O(1) workspace and no candidate geometry work.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's already measured residual vector is consumed directly; no readings or predicates are cached across iterations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This synchronous boolean operation retains no input arrays, allocations, handles or tasks after return.
 */
export function humanBodySimpleResidualsMet(
  residuals: readonly number[],
  unknowns: readonly Pick<IHumanBodySimpleUnknown, "target" | "tolerance">[],
): boolean {
  return residuals.every(
    (value: number, index: number): boolean =>
      Number.isFinite(value) &&
      Math.abs(value * unknowns[index].target) <= unknowns[index].tolerance,
  );
}
