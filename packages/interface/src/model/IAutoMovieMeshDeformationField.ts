import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A compact ellipsoidal deformation of an existing surface. The field has zero influence outside its radii and fades with a continuous derivative at the boundary, so neighbouring anatomy remains part of one deformation function.
 *
 * @evidence contracts/common.md#principled-implementation An axis-aligned ellipsoid bounds displacement-plus-stretch weighted by `(1 - r^2)^3`. The deformer transports normals through analytic Jacobian cofactors and checks positive vertex determinants and emitted triangle orientation; these local/tessellation checks do not prove the field between vertices or exclude global self-intersection.
 * @evidence contracts/common.md#clear-and-simple-design Centre and radii locate support while displacement and dimensionless stretch describe its local effect; mesh buffers and optional per-vertex influences stay inputs of the compiled deformer rather than fields of this reusable definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same smooth kernel applies to every feature without named-anatomy exceptions; zero displacement and stretch are neutral, and invalid vectors or nonpositive radii are refused during compilation instead of clamped.
 * @evidence contracts/common.md#meaningful-documentation Gives compact support and smooth boundary behavior, mesh-local metre coordinates, strictly positive radii, centre displacement and dimensionless stretch offsets with neutral zero.
 * @author Samchon
 */
export interface IAutoMovieMeshDeformationField {
  /** Centre in mesh-local metres. All coordinates must be finite. */
  center: IAutoMovieVector3;

  /** Strictly positive support radii in mesh-local metres. */
  radius: IAutoMovieVector3;

  /** Translation at the field centre, in metres; zero is neutral. */
  displacement: IAutoMovieVector3;

  /** Per-axis local stretch offsets; zero is neutral, 0.1 adds ten percent. */
  stretch: IAutoMovieVector3;
}
