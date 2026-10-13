import type { IHumanViewerReferenceBox } from "./IHumanViewerReferenceBox.js";

/**
 * One layer of the composed capture, drawn in array order.  *
 *
 * @evidence contracts/common.md#principled-implementation Source selection, destination pixels, alpha and optional clip describe one canvas layer in painter order.
 * @evidence contracts/common.md#clear-and-simple-design The layer records layout decisions once so drawing only executes their order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Render and photo are supported composition sources, without per-subject image treatment.
 * @evidence contracts/common.md#meaningful-documentation A null clip exposes the whole destination; alpha is unit-range and box coordinates are capture pixels.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Source selection, destination pixels, alpha and optional clip describe one canvas layer in painter order.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Render and photo are supported composition sources, without per-subject image treatment.
 * @author Samchon
 */
export interface IHumanViewerReferenceLayer {
  /**
   * The rendered viewport, or the local reference photograph.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Selects the supplied render canvas or local photograph as one explicit composition input.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Selects the supplied render canvas or local photograph as one explicit composition input.
   */
  source: "render" | "photo";

  /**
   * Destination rectangle, with the photograph already fitted.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the shared layout's already-fitted capture-pixel destination rather than recomputing geometry while drawing.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the shared layout's already-fitted capture-pixel destination rather than recomputing geometry while drawing.
   */
  box: IHumanViewerReferenceBox;

  /**
   * Opacity of this layer, between zero and one.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Carries the selected unit-range layer opacity independently of numerical model material state.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Carries the selected unit-range layer opacity independently of numerical model material state.
   */
  alpha: number;

  /**
   * Visible window inside the destination, or null for all of it.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Keeps an optional capture-pixel visible window, with null for the whole destination.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Keeps an optional capture-pixel visible window, with null for the whole destination.
   */
  clip: IHumanViewerReferenceBox | null;
}
