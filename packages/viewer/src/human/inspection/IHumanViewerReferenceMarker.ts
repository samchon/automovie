/**
 * One observed landmark placed in capture pixels.  *
 *
 * @evidence contracts/common.md#principled-implementation Pixel marker coordinates are the image-to-capture layout's projection of an observed photograph landmark.
 * @evidence contracts/common.md#clear-and-simple-design Only marker centre and group label are needed by PNG and SVG overlays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Markers preserve observations without determining the subject's anatomical construction.
 * @evidence contracts/common.md#meaningful-documentation x and y use capture pixels from the top-left origin, and group retains the reference observation identity.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Pixel marker coordinates are the image-to-capture layout's projection of an observed photograph landmark.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Markers preserve observations without determining the subject's anatomical construction.
 * @author Samchon
 */
export interface IHumanViewerReferenceMarker {
  /**
   * Horizontal position of the observed marker centre in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the observed marker centre projected into capture-pixel horizontal coordinates.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the observed marker centre projected into capture-pixel horizontal coordinates.
   */
  x: number;

  /**
   * Vertical position of the observed marker centre in capture pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the same marker's capture-pixel vertical coordinate for matching SVG and PNG overlays.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the same marker's capture-pixel vertical coordinate for matching SVG and PNG overlays.
   */
  y: number;

  /**
   * Original observed landmark group, shared by the PNG and SVG overlays.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Preserves the original observed landmark group instead of assigning anatomical identity from its position.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Preserves the original observed landmark group instead of assigning anatomical identity from its position.
   */
  group: string;
}
