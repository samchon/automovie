import type { IHumanBodySimpleUnknown } from "./IHumanBodySimpleUnknown";

/**
 * Test relative solve residuals against each named measurement's absolute budget.
 *
 * The coupled solver defines r=(reading-target)/target for positive targets.
 * Multiplying r by that same target recovers the error in metres or kilograms,
 * so a millimetre tape budget cannot become a mass-relative percentage. The
 * solver supplies matching row counts and admitted targets/tolerances. Empty
 * systems are met; a nonfinite residual is not met. Inputs remain unchanged.
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
