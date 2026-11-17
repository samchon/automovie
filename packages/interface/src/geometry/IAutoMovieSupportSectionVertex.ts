/**
 * A feasible corner of a convex half-plane section in a local XZ metre chart.
 *
 * evaluateSupportSection and createSupportSectionQuery publish fresh mutable
 * corners in counter-clockwise polygon order, without repeating closure. They
 * reject unresolved or nonpositive-area intersections rather than returning an
 * empty admitted polygon. The supplying caller admits unit normals, finite
 * offsets, bounded directions and the minimum direction sine.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines index identity, exact incidence, chart units, ordering, output ownership and caller versus query admission.
 * @evidence contracts/development/design.md#principled-representation Pair and tight indices refer to the same ordered half-plane input; point coordinates are geometric results rather than a proximity-based vertex identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Direct and prepared section queries produce the same corner record for support-loft realization and recovery.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exact incidence applies to the supplied binary64 coefficients, not measurement uncertainty or a numerical closeness threshold.
 */
export interface IAutoMovieSupportSectionVertex {
  /** Ascending indices of the first nonparallel pair among this vertex's tight planes. */
  pair: [number, number];

  /** Sorted unique indices of all exactly incident constraints, including pair. */
  tight: number[];

  /** Fresh mutable [X,Z] intersection in the offsets' local metre chart. */
  point: [number, number];
}
