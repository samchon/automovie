import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check X, Y then Z against the same inclusive bounds in the caller's unchanged frame.
 *
 * @evidence contracts/common.md#principled-implementation Applies the shared finite inclusive scalar interval to X, Y then Z of a schema-admitted vector. Coordinate, scale and wind callers own units, frame and ordered bounds; this checks components rather than vector norm or derived placement.
 * @evidence contracts/common.md#clear-and-simple-design One vector projection supplies axis labels while the scalar owner defines admission; caller-specific coordinate, scale and motion policies remain at their field gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States axis order, shared bounds and unchanged coordinate frame; component findings append to the borrowed array without normalization, clamping or vector mutation.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed scalar bound checks preserve axis order with constant local state.
 * @evidence contracts/performance.md#reuse-equivalent-work Three component checks share the same supplied bounds and attribution; this wrapper retains no vector-validity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Axis labels are temporary unless retained by up to three appended findings; the caller owns its diagnostic array and the vector remains borrowed without a handle or task.
 */
export const validateProductionDesignBoundedVector: (diagnostics: IAutoMovieDiagnostic[], value: { x: number; y: number; z: number; }, min: number, max: number, target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  value: { x: number; y: number; z: number },
  min: number,
  max: number,
  target: string,
  file: string,
  field: string,
): void => {
  validateProductionDesignBounded(diagnostics, value.x, min, max, target, file, `${field}.x`);
  validateProductionDesignBounded(diagnostics, value.y, min, max, target, file, `${field}.y`);
  validateProductionDesignBounded(diagnostics, value.z, min, max, target, file, `${field}.z`);
};
