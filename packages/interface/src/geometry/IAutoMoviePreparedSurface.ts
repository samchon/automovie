import type { IAutoMovieSurface } from "../scene/IAutoMovieSurface";
import type { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Prepared outer and hole footprint for repeated XZ containment of one authored
 * surface.
 *
 * An outer ring and its holes preserve the authored contour rather than fitting
 * a hull. Source height evaluation is independent of that prepared horizontal
 * containment.
 */
export interface IAutoMoviePreparedSurface {
  /** Original surface reference used for its ID and current height rule. */
  readonly surface: IAutoMovieSurface;

  /**
   * Prepared planar outer and hole rings with signed areas. Concavity and holes
   * participate in later containment.
   */
  readonly footprint: IAutoMovieFootprint;
}
