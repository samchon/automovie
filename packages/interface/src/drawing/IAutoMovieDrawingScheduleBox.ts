import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box a space schedule row reports.
 *
 * Both corners are world coordinates in metres rounded to six decimals. Rounding can merge nearby bounds or cross a grid boundary after a small input change; it does not make the schedule digest generally insensitive to floating-point noise.
 *
 * @evidence contracts/development/design.md#principled-representation Declared boxes fold shell vertices or per-cell axis limits; cell normals count components with absolute magnitude above 1e-9 and ignore smaller components without normalization. All three axis limits must be finite, but the helper does not establish a nonempty cell before folding endpoints. Content boxes instead fold static CPU element and population proxies, and both outputs round to six decimals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two corner vectors are the smallest form of an axis-aligned box and match the shape of the content bounds it is copied from, so the declared and content boxes of a space place read the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cell with multiple above-threshold normal components or an unclosed finite axis limit yields null for the declared space box. Near-axis components, endpoint folding and grid rounding remain approximation boundaries; this record does not certify the exact half-space intersection or a rendered-frame enclosure.
 * @evidence contracts/development/common.md#meaningful-documentation States the world frame, the metre unit, the six-decimal rounding and its reason, and the corner ordering.
 */
export interface IAutoMovieDrawingScheduleBox {
  /** Lower corner in world metres. */
  min: IAutoMovieVector3;

  /** Upper corner in world metres. */
  max: IAutoMovieVector3;
}
