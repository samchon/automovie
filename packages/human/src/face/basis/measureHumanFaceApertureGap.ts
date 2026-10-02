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
 * @evidence contracts/common.md#principled-implementation The dot product of upper-minus-lower with a unit direction is the signed projected separation; translation of both points cancels and no camera frame enters the measurement.
 * @evidence contracts/common.md#clear-and-simple-design One projection owns the aperture quantity used by both preliminary closure and final-contact consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamping or subject-specific aperture is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the two consumers, units, unit-axis premise, sign and measurement limit.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres for both points and a dimensionless unit direction; the result remains signed metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Measures supplied points without owning a part or composition.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines or consumes no form channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits a measurement without changing geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no surface or joint boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part; aperture owners observe their final geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contains no anatomical dimension or range of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range Reports separation without admitting a physiological state.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no author input that shapes a form.
 */
export function measureHumanFaceApertureGap(
  upper: IAutoMovieVector3,
  lower: IAutoMovieVector3,
  up: IAutoMovieVector3,
): number {
  return Vector3.dot(Vector3.subtract(upper, lower), up);
}
