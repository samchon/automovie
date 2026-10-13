/**
 * One observed landmark of a reference photograph, in unit image coordinates.
 *
 * @evidence contracts/common.md#meaningful-documentation States the coordinate convention.
 *
 * @evidence contracts/common.md#principled-implementation Unit-image x and y retain photograph observations independently of capture pixel dimensions.
 * @evidence contracts/common.md#clear-and-simple-design Coordinates and landmark group are the complete overlay observation record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed markers are supplied reference data and never determine anatomical vertices or acceptance.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Unit-image x and y retain photograph observations independently of capture pixel dimensions.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Observed markers are supplied reference data and never determine anatomical vertices or acceptance.
 *
 * @author Samchon
 */
export interface IHumanViewerLandmark {
  /**
   * Horizontal position, 0 at the left edge and 1 at the right.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Retains the observed horizontal photograph coordinate in the unit interval from left to right.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Retains the observed horizontal photograph coordinate in the unit interval from left to right.
   */
  x: number;

  /**
   * Vertical position, 0 at the top edge and 1 at the bottom.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Retains the observed vertical photograph coordinate in the unit interval from top to bottom.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Retains the observed vertical photograph coordinate in the unit interval from top to bottom.
   */
  y: number;

  /**
   * Landmark group name.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Preserves the observed landmark's group identity across SVG and PNG overlays.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Preserves the observed landmark's group identity across SVG and PNG overlays.
   */
  group: string;
}
