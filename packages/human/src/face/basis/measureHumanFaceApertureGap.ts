import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Signed separation of an upper/lower aperture pair along its opening axis.
 * The aperture owner uses the same projection before closure, and the pose
 * evaluator uses it after tissue contact on the final rendered positions.
 * Points share basis-frame metres; up is the caller's unit opening direction.
 * Positive means upper lies above lower, zero means a sealed projected pair,
 * and negative means their projected order reversed. It measures no tissue
 * mechanics and mutates no input.
 *
 * @evidence contracts/common.md#principled-implementation The dot product of upper-minus-lower with the caller's unit up direction yields a signed projected separation in shared basis metres. Native aperture, closure and final pose callers supply that matched frame; the result is not Euclidean distance or whole-course closure.
 * @evidence contracts/common.md#clear-and-simple-design One shared scalar projection keeps pre-closure and post-contact aperture conventions identical without embedding source lookup or motion evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative gaps preserve reversed projected order instead of clamping to zero, and zero denotes only this projected pair. Finite/frame admission belongs to current callers rather than an invented anatomical threshold here.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies caller timing, unit direction, metre frame, signed result and immutable inputs without suggesting tissue mechanics.
 * @evidence contracts/performance.md#efficient-algorithms One fixed three-coordinate subtraction and dot product use constant arithmetic and a small temporary vector, with no mesh/row traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work All current aperture consumers share this projection owner and their already resolved frame; caching three-coordinate arithmetic would add identity state without avoiding meaningful work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar is returned and the temporary vector is collectible after the call; no input, pose history, task or external resource is retained.
 */
export function measureHumanFaceApertureGap(
  upper: IAutoMovieVector3,
  lower: IAutoMovieVector3,
  up: IAutoMovieVector3,
): number {
  return Vector3.dot(Vector3.subtract(upper, lower), up);
}
