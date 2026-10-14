import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check X then Z against the same inclusive bounds for a planar declaration.
 *
 * @evidence contracts/common.md#principled-implementation The caller owns units and frame and no missing height or direction is invented.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignBounded2 owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed scalar bound checks preserve axis order with constant local state.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateProductionDesignBounded2: (diagnostics: IAutoMovieDiagnostic[], value: { x: number; z: number; }, min: number, max: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: { x: number; z: number },
  min: number,
  max: number,
  target: string,
  file: string,
  field: string,
): void => {
  validateProductionDesignBounded(diagnostics, value.x, min, max, target, file, `${field}.x`);
  validateProductionDesignBounded(diagnostics, value.z, min, max, target, file, `${field}.z`);
};
