/**
 * A feasible corner of a convex half-plane section in a local XZ metre chart.
 *
 * EvaluateSupportSection and createSupportSectionQuery publish fresh mutable
 * corners in counter-clockwise polygon order, without repeating closure. They
 * reject unresolved or nonpositive-area intersections rather than returning an
 * empty admitted polygon. The supplying caller admits unit normals, finite
 * offsets, bounded directions and the minimum direction sine.
 */
export interface IAutoMovieSupportSectionVertex {
  /**
   * Ascending indices of the first nonparallel pair among this vertex's tight
   * planes.
   */
  pair: [number, number];

  /** Sorted unique indices of all exactly incident constraints, including pair. */
  tight: number[];

  /** Fresh mutable [X,Z] intersection in the offsets' local metre chart. */
  point: [number, number];
}
