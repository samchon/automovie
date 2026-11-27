import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3.js";

/**
 * The camera an inspection view resolved to, as a record keeps it so a later
 * round draws through the same camera.
 */
export interface IAutoMovieInspectionCamera {
  /**
   * The view text that resolved to this camera, such as `front@ortho` or
   * `film`.
   */
  view: string;

  /** Which projection draws the picture. */
  projection: "perspective" | "orthographic";

  /** Eye, world metres. */
  position: IAutoMovieVector3;

  /** Point looked at, world metres. */
  target: IAutoMovieVector3;

  /** Up direction of the picture, a world unit vector. */
  up: IAutoMovieVector3;

  /**
   * Vertical field of view in degrees for a perspective camera, null for an
   * orthographic one.
   */
  fovDeg: number | null;

  /**
   * Metres of world one picture pixel spans for an orthographic camera, null
   * for a perspective one.
   */
  metresPerPixel: number | null;

  /** Near clip distance, metres. */
  near: number;

  /** Far clip distance, metres. */
  far: number;
}
