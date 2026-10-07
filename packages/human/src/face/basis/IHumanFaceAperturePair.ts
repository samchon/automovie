import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One posed upper/lower midline vertex pair and its signed aperture.
 *
 * @evidence contracts/common.md#principled-implementation The gap is the projection of the two stored points, so the record is self-consistent.
 * @evidence contracts/common.md#clear-and-simple-design Two points and their gap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The gap is measured, never stored independently of the points.
 * @evidence contracts/common.md#meaningful-documentation States each field and the sign of the gap.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the Y-up head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact summary reports apertures.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is not an input.
 * @author Samchon
 */
export interface IHumanFaceAperturePair {
  /** Posed upper vertex. */
  upper: IAutoMovieVector3;

  /** Posed lower vertex. */
  lower: IAutoMovieVector3;

  /** Upper minus lower along the opening direction; positive is open, zero sealed. */
  gap: number;
}
