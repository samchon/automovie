import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check X, Y then Z finiteness in the caller's unchanged coordinate frame.
 *
 * @evidence contracts/common.md#principled-implementation Delegates X, Y then Z to Number.isFinite admission for schema-admitted world and predicate coordinates. Callers retain coordinate units and frame; finite components alone do not prove physical range, vector norm or finite derived arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design This axis projection adds field suffixes while one scalar owner defines nonfinite refusal for every component.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States axis order, finiteness-only scope and unchanged frame; component findings append to the caller's array without normalizing or modifying the vector.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed finite checks preserve axis order with constant local state.
 * @evidence contracts/performance.md#reuse-equivalent-work Three component checks share attribution and the same scalar rule; no earlier vector verdict is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Axis labels are temporary unless retained by up to three appended findings; the caller owns its diagnostic array and the vector stays borrowed without a handle or task.
 */
export const validateProductionDesignVector: (diagnostics: IAutoMovieDiagnostic[], value: { x: number; y: number; z: number; }, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: { x: number; y: number; z: number },
  target: string,
  file: string,
  field: string,
): void => {
  validateProductionDesignFinite(diagnostics, value.x, target, file, `${field}.x`);
  validateProductionDesignFinite(diagnostics, value.y, target, file, `${field}.y`);
  validateProductionDesignFinite(diagnostics, value.z, target, file, `${field}.z`);
};
