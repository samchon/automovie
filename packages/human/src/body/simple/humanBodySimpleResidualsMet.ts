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
 * @evidence contracts/common.md#principled-implementation Undoing each row's positive-target normalization recovers its absolute measurement error, then the inclusive tolerance comparison admits exactly its declared budget.
 * @evidence contracts/common.md#clear-and-simple-design One pure termination predicate owns the unit conversion; iteration and body readings stay with the solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each row supplies its own budget; no person, fixture or global percentage threshold is selected.
 * @evidence contracts/common.md#meaningful-documentation States the residual definition, positive-target premise, units, empty/nonfinite behavior and read-only ownership.
 * @evidence contracts/modeling.md#spatial-conventions Dimensionless relative residual is converted back to the target's measurement unit by multiplication; no body coordinate frame is changed.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It owns no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no shape channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input's measurement rule owns anatomy; this predicate carries only numerical precision budgets.
 * @evidenceExclude contracts/anatomy.md#permitted-range A numerical error budget is not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is a termination test, not an authored body control.
 */
export function humanBodySimpleResidualsMet(
  residuals: readonly number[],
  unknowns: readonly Pick<IHumanBodySimpleUnknown, "target" | "tolerance">[],
): boolean {
  return residuals.every(
    (value, index) =>
      Number.isFinite(value) &&
      Math.abs(value * unknowns[index].target) <= unknowns[index].tolerance,
  );
}
