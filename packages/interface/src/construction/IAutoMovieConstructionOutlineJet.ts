/**
 * Authored derivatives of a source outline at one knot, with respect to its normalized source parameter tau in [0,1].
 *
 * Tau normalizes the whole outline's selected source parameter between its first and last knots. Both derivatives have the outline value's units because tau is dimensionless. A null component starts from the unconstrained natural derivative. An explicit range may filter a wholly unauthored jet; when either component is authored, both final components are retained or the hull is refused. Shared first and second derivatives define C2 quintic Hermite spans; first derivatives alone do not imply C2 cubic Hermite interpolation. The existing straight tangent extension remains C1, rather than C2, at an open endpoint with an authored nonzero second derivative.
 *
 * @evidence contracts/development/design.md#principled-representation Endpoint value, first derivative and second derivative determine the unique degree-at-most-five Hermite span, with one shared jet at every knot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two nullable derivative components express authored tangency/curvature without a second control-point representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null explicitly starts from a natural derivative; a separately requested range may filter only a wholly unauthored jet. Supplied derivatives are retained or refused, never fitted to a mesh or silently changed to satisfy a bound.
 * @evidence contracts/development/common.md#meaningful-documentation States normalized parameter, derivative units, null meaning and C2 semantics.
 */
export interface IAutoMovieConstructionOutlineJet {
  /** First derivative in normalized source parameter; null starts from the natural derivative before any explicit wholly-unauthored range filtering. */
  first: number | null;

  /** Second derivative in normalized source parameter; null starts from the natural derivative under the same range ownership. */
  second: number | null;
}
