import type { IAutoMovieSurface } from "../../scene/IAutoMovieSurface";
import type { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Prepared footprint for one surface. Build once when checking many points
 * against the same static polygon.
 */
export interface IAutoMoviePreparedSurface {
  /** The source surface whose height/identity remains authoritative. */
  readonly surface: IAutoMovieSurface;

  /**
   * The authored rings of {@link IAutoMovieSurface.polygon} and its holes, with
   * planar copies and signed areas prepared for repeated queries.
   */
  readonly footprint: IAutoMovieFootprint;
}
