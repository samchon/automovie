import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieVector3 } from "@automovie/interface";
import { validateSoftNumeric as numeric } from "./validateSoftNumeric";
/**
 * Validate three authored vector components through the shared finite-scalar policy.
 *
 * @evidence contracts/common.md#principled-implementation Each x/y/z coordinate is independently required finite; this pass establishes neither nonzero direction nor a normalized vector.
 * @evidence contracts/common.md#clear-and-simple-design A three-axis adapter owns coordinate paths and labels while callers separately decide whether the vector is a point, axis, force or target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or non-finite components are reported by scalar range admission without substituting origin coordinates.
 * @evidence contracts/common.md#meaningful-documentation States component finiteness, axis-specific paths and the absence of normalization or magnitude admission.
 * @evidence contracts/performance.md#efficient-algorithms Exactly three scalar checks take constant work and can append at most three findings.
 * @evidence contracts/performance.md#reuse-equivalent-work The scalar owner supplies consistent finite-value diagnostics to both vector and direct scalar callers; vector values are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input vector is read without mutation; only appended scalar findings survive in the caller's collector.
 */
export const validateSoftVector: (out: ViolationCollector, path: string, value: IAutoMovieVector3) => void = (
  out: ViolationCollector,
  path: string,
  value: IAutoMovieVector3,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    numeric(
      out,
      `${path}.${axis}`,
      `${axis} component`,
      value[axis],
      -Infinity,
      false,
      Infinity,
    );
};
