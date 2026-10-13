import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One axis-aligned model-local volume.
 *
 * The engine transforms all eight corners by the prop's full staged TRS
 * (translation, unit quaternion, per-axis scale) and takes the world bounds of
 * the result, so a rotated box widens rather than being silently re-fitted.
 *
 * @author Samchon
 */
export interface IAutoMoviePropBox {
  /** Local minimum corner. */
  min: IAutoMovieVector3;

  /** Local maximum corner, strictly greater on every axis. */
  max: IAutoMovieVector3;
}
