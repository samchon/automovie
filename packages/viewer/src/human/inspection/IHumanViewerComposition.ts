import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The photograph layer composed with the displayed frame.
 *
 * @evidence contracts/common.md#meaningful-documentation Names what the capture composes over the render.
 *
 * @evidence contracts/common.md#principled-implementation Composition mode, unit-range opacity, pixel extent and observed landmarks specify the 2D photograph layer independently of numerical geometry.
 * @evidence contracts/common.md#clear-and-simple-design Only display-layer choices are present, with landmarks grouped in their shared image convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference composition cannot enter model construction or numerical cache identity through these fields.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Composition mode, unit-range opacity, pixel extent and observed landmarks specify the 2D photograph layer independently of numerical geometry.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Reference composition cannot enter model construction or numerical cache identity through these fields.
 *
 * @author Samchon
 */
export interface IHumanViewerComposition {
  /**
   * How the photograph meets the render.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Preserves the selected split, overlay or swipe relationship between rendered pixels and a local reference.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Preserves the selected split, overlay or swipe relationship between rendered pixels and a local reference.
   */
  mode: "split" | "overlay" | "swipe";

  /**
   * Overlay opacity or swipe position, 0 to 1.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the selected unit-range overlay alpha or swipe position without changing numerical geometry.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the selected unit-range overlay alpha or swipe position without changing numerical geometry.
   */
  opacity: number;

  /**
   * Frame size in pixels.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Keeps the composition's capture-pixel extent explicit for display and PNG equivalence.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Keeps the composition's capture-pixel extent explicit for display and PNG equivalence.
   */
  size: number;

  /**
   * Landmarks drawn over the photograph, empty when off.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries actual unit-image observations selected for the reference overlay, with empty meaning no markers.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries actual unit-image observations selected for the reference overlay, with empty meaning no markers.
   */
  landmarks: IHumanViewerLandmark[];
}
