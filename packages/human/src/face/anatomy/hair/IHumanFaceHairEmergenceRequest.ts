import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One root's emergence request to `humanFaceHairEmergence`.
 *
 * `normal` is the root's surface normal and `field` the authored growth field
 * there, both in the neutral head frame. `degrees` is the exit elevation above
 * the tangent plane, supplied as an admitted authored target or chosen from
 * the legacy scalp interval; the field's tangential part fixes the azimuth.
 *
 * @author Samchon
 */
export interface IHumanFaceHairEmergenceRequest {
  /** Root surface normal. */
  normal: IAutoMovieVector3;

  /** Authored growth field at the root. */
  field: IAutoMovieVector3;

  /** Exit elevation above the tangent plane, in degrees. */
  degrees: number;
}
