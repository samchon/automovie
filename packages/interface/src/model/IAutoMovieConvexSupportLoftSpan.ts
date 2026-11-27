import type { IAutoMoviePhysicalYInterval } from "./IAutoMoviePhysicalYInterval";

/** Cubic support offsets over one physical Y interval. */
export interface IAutoMovieConvexSupportLoftSpan {
  /** Physical Y interval of this span, in metres. */
  interval: IAutoMoviePhysicalYInterval;

  /**
   * Four Bernstein offsets per plane, in registry order and metres; adjacent
   * spans share endpoints exactly.
   */
  offsets: [number, number, number, number][];
}
