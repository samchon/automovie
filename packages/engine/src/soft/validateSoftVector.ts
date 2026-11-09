import { IAutoMovieVector3 } from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { validateSoftNumeric as numeric } from "./validateSoftNumeric";

/**
 * Validate three authored vector components through the shared finite-scalar policy.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each x/y/z coordinate is independently required finite; this pass establishes neither nonzero direction nor a normalized vector.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A three-axis adapter owns coordinate paths and labels while callers separately decide whether the vector is a point, axis, force or target.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing or non-finite components are reported by scalar range admission without substituting origin coordinates.
 * @evidence contracts/development/common.md#meaningful-documentation States component finiteness, axis-specific paths and the absence of normalization or magnitude admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms Exactly three scalar checks take constant work and can append at most three findings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The scalar owner supplies consistent finite-value diagnostics to both vector and direct scalar callers; vector values are not cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The input vector is read without mutation; only appended scalar findings survive in the caller's collector.
 */
export const validateSoftVector: (
  out: ViolationCollector,
  path: string,
  value: IAutoMovieVector3,
) => void = (
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
