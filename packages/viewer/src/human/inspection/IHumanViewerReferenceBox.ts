/**
 * One rectangle in capture pixels, the origin at the top left.  *
 *
 * @evidence contracts/common.md#principled-implementation The rectangle uses capture pixels with a top-left origin, matching canvas layer destination and clipping coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Origin and extent remain four independent scalar fields used by the 2D layout owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Its dimensions are layout outputs rather than special constants for a particular photograph.
 * @evidence contracts/common.md#meaningful-documentation x and y locate the top-left corner; w and h give the nonnegative pixel extents.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The rectangle uses capture pixels with a top-left origin, matching canvas layer destination and clipping coordinates.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Its dimensions are layout outputs rather than special constants for a particular photograph.
 * @author Samchon
 */
export interface IHumanViewerReferenceBox {
  /**
   * Horizontal position of the rectangle's left edge in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Locates the destination or clipping rectangle's left edge in capture pixels.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Locates the destination or clipping rectangle's left edge in capture pixels.
   */
  x: number;

  /**
   * Vertical position of the rectangle's top edge in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Locates its top edge in the same top-left capture-pixel coordinate convention.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Locates its top edge in the same top-left capture-pixel coordinate convention.
   */
  y: number;

  /**
   * Rectangle width in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the pixel width selected by shared reference layout for both display and PNG composition.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the pixel width selected by shared reference layout for both display and PNG composition.
   */
  w: number;

  /**
   * Rectangle height in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the pixel height selected by that same layout instead of an unrelated image-space extent.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the pixel height selected by that same layout instead of an unrelated image-space extent.
   */
  h: number;
}
