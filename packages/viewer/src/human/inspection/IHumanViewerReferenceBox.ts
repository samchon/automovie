/**
 * One rectangle in capture pixels, the origin at the top left.
 *
 * @evidence contracts/common.md#principled-implementation Capture-pixel coordinates represent fitted photograph and clip rectangles without mixing normalized landmark coordinates into drawing dimensions.
 * @evidence contracts/common.md#clear-and-simple-design Four numeric edges describe the rectangle shared by layout and canvas composition; clipping uses the same representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rectangle carries no document identity or photograph-specific placement; layout derives every edge from capture dimensions.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the top-left origin and pixel units for all four members; geometric admission belongs to layout.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased rectangle declaration selects no algorithm; layout computes its four scalar coordinates.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pixel boxes describe one layout result and define no request cache, equivalence key or invalidation policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The coordinate record declares no handles or release protocol; its enclosing composition owns its lifetime.
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
