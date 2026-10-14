import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check X, Y then Z finiteness in the caller's unchanged coordinate frame.
 *
 * @evidence contracts/common.md#principled-implementation This reports declared coordinates without normalization or inferred geometry.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignVector owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed finite checks preserve axis order with constant local state.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
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
