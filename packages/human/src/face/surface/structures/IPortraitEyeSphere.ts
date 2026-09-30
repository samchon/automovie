import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The visible eye's spherical curvature basis, in construction millimetres.
 * A fitted surface radius is a portrait control, not a measured globe diameter.
 *
 * @author Samchon
 */
export interface IPortraitEyeSphere {
  /** Sphere centre behind the fitted lid opening. */
  center: IAutoMovieVector3;

  /** Positive spherical surface radius in millimetres. */
  radius: number;
}
