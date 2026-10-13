import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A compact ellipsoidal deformation of an existing surface. The field has zero
 * influence outside its radii and fades with a continuous derivative at the
 * boundary, so neighbouring anatomy remains part of one deformation function.
 *
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
