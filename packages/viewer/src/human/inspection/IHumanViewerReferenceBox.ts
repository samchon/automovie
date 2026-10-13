/**
 * One rectangle in capture pixels, the origin at the top left.  *
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
