import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Prepared footprint for one surface. Build once when checking many points
 * against the same static polygon.
 *
 * @author Samchon
 */
export interface IAutoMoviePreparedSurface {
  /** The source surface whose height/identity remains authoritative. */
  readonly surface: IAutoMovieSurface;

  /**
   * The exact plan region of {@link IAutoMovieSurface.polygon} and its holes.
   *
   * This used to be the footprint's convex hull, which is why an L-shaped plate
   * had to be refused: a hull fills the notch, and a hull of a holed slab fills
   * the atrium. The region carried here is the rings themselves.
   */
  readonly footprint: IAutoMovieFootprint;
}
