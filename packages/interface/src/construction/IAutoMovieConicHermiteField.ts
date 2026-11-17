/**
 * Data and callback contracts shared by the ConicHermiteField operations.
 *
 * @evidence contracts/development/design.md#principled-representation Projective readings pair physical points with interior log probabilities; direction readings pair increasing-polar unit tangents with their logarithmic speed scale.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConicHermiteField publishes these intermediate readings to the conic geometry readers through interface-owned types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty log array denotes an explicit endpoint; neither record replaces a failed finite geometry reading.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes interior probabilities, endpoint behavior and tangent orientation.
 */
export namespace IAutoMovieConicHermiteField {
  /**
   * Point and normalized homogeneous log probabilities at one clock.
   *
   * @evidence contracts/development/design.md#principled-representation The projective Bernstein mean preserves the original positive rational polygon.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One intermediate serves point and tangent evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An endpoint has an explicit point and no invented finite clock.
   * @evidence contracts/development/common.md#meaningful-documentation Point uses physical quarter coordinates; logs are dimensionless log probabilities.
   */
  export interface IProjective<T> {
    /** Physical point in the selected end chart. */
    point: readonly [T, T];

    /** Four log probabilities for an interior clock; empty at an explicit endpoint. */
    logs: readonly T[];
  }

  /**
   * Increasing-polar unit tangent and logarithmic speed scale.
   *
   * @evidence contracts/development/design.md#principled-representation Positive pair sums avoid subtraction of parallel native derivatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The numeric curvature owner and source reader share one direction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the first source derivatives of the unit tangent are externally required.
   * @evidence contracts/development/common.md#meaningful-documentation Interior speed uses log-odds clock; endpoint speed uses its polygon edge scale.
   */
  export interface IDirection<T> {
    /** Increasing-polar unit tangent in the selected end chart. */
    tangent: readonly [T, T];

    /** Logarithm of physical positive speed or endpoint edge length. */
    logSpeed: T;
  }
}
