import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Check X then Z against the same inclusive bounds for a planar declaration.
 *
 * @evidence contracts/common.md#principled-implementation Delegates X then Z to the finite inclusive scalar-bound rule; world surface and route callers supply ordered metre bounds in their unchanged planar frame.
 * @evidence contracts/common.md#clear-and-simple-design This planar projection supplies axis attribution while the scalar owner keeps one finiteness and interval policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States X/Z order and common bounds; axis findings append to the borrowed array, the input point stays unchanged and no height is inferred.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed scalar bound checks preserve axis order with constant local state.
 * @evidence contracts/performance.md#reuse-equivalent-work Both component checks borrow the same bounds and attribution within the call; no earlier point verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Axis labels are temporary unless retained by up to two appended findings; the caller owns its diagnostic array and the point remains borrowed without a handle or task.
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
