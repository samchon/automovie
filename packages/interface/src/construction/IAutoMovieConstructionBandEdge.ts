import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** A carried band and its correspondence to the child. */
export interface IAutoMovieConstructionBandEdge {
  /**
   * The band's surface, the strip's chart, name, orientation, period and
   * domain.
   */
  surface: IAutoMovieSolidSurface;

  /** The child's chart point on its rail at a band clock. */
  rail: (clock: number) => [number, number];

  /**
   * The band clock whose rail point stands at a child phase, in `[0, 2 pi)`:
   * the inverse of the monotone correspondence.
   */
  clock: (phase: number) => number;
}
