import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Linearly interpolate two vectors by influence `t`.
 *
 * @evidence contracts/common.md#principled-implementation Compute a+(b-a)*t component-wise through shared Vector3 operations; influence admission is the caller's responsibility and extrapolation is possible for unrestricted t.
 * @evidence contracts/common.md#clear-and-simple-design A small shared vector helper keeps world-driver influence arithmetic consistent without a separate interpolation policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamping, fixture tolerance or nonfinite repair is introduced; finite intermediate arithmetic and compatible coordinate spaces are caller premises.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies linear interpolation; input vectors are borrowed and a fresh result is returned.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed vector operations take O(1) time and fixed-size temporary/result allocations.
 * @evidence contracts/performance.md#reuse-equivalent-work All supported world drivers reuse the same arithmetic law; no vector-identity cache is valid for mutable coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the result vector escapes; intermediate vectors are call-local and no graph, buffer handle or task is retained.
 */
export const blendVec: (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
) => IAutoMovieVector3 = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 =>
  Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), t));
