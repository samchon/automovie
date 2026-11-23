/** Data and callback contracts shared by the ConicHermiteField operations. */
export namespace IAutoMovieConicHermiteField {
  /** Point and normalized homogeneous log probabilities at one clock. */
  export interface IProjective<T> {
    /** Physical point in the selected end chart. */
    point: readonly [T, T];

    /**
     * Four log probabilities for an interior clock; empty at an explicit
     * endpoint.
     */
    logs: readonly T[];
  }

  /** Increasing-polar unit tangent and logarithmic speed scale. */
  export interface IDirection<T> {
    /** Increasing-polar unit tangent in the selected end chart. */
    tangent: readonly [T, T];

    /** Logarithm of physical positive speed or endpoint edge length. */
    logSpeed: T;
  }
}
