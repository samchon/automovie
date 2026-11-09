/**
 * Saved cubic coefficient basis. The choice preserves the curve's phase chart.
 *
 * @evidence contracts/development/design.md#principled-representation Both bases describe the same degree-three polynomial on each original interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One closed choice serves observation, conversion and command publication.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The choice does not request fitting or degree reduction.
 * @evidence contracts/development/common.md#meaningful-documentation States that the phase chart remains authoritative.
 */
export type AutoMovieRecoveryCurveFormat = "bezier" | "hermite";
