/**
 * One rectangle in capture pixels, the origin at the top left.  *
 *
 * @evidence contracts/common.md#principled-implementation The rectangle uses capture pixels with a top-left origin, matching canvas layer destination and clipping coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Origin and extent remain four independent scalar fields used by the 2D layout owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Its dimensions are layout outputs rather than special constants for a particular photograph.
 * @evidence contracts/common.md#meaningful-documentation x and y locate the top-left corner; w and h give the nonnegative pixel extents.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceBox {
  /** Horizontal position of the rectangle's left edge in capture pixels. */
  x: number;

  /** Vertical position of the rectangle's top edge in capture pixels. */
  y: number;

  /** Rectangle width in capture pixels. */
  w: number;

  /** Rectangle height in capture pixels. */
  h: number;
}
