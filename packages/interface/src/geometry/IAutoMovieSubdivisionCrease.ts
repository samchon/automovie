/**
 * Authored sharpness on one undirected edge of a subdivision cage.
 *
 * Interior edges below sharpness 10 lose one unit per refinement. A remaining
 * fraction blends the edge's sharp and smooth rules. A value of 10 is
 * permanently sharp. Every boundary edge uses permanent sharpness regardless of
 * an explicit value.
 */
export interface IAutoMovieSubdivisionCrease {
  /** Index of one end vertex of the cage edge. */
  from: number;

  /** Index of the other end vertex; the order of `from` and `to` is free. */
  to: number;

  /**
   * Finite sharpness from `0` (smooth) to `10` (infinitely sharp); fractional
   * values blend the sharp and smooth rules for one step.
   */
  sharpness: number;
}
