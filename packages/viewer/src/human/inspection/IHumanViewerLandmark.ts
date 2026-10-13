/**
 * One observed landmark of a reference photograph, in unit image coordinates.
 *
 * @evidence contracts/common.md#meaningful-documentation States the coordinate convention.
 *
 * @evidence contracts/common.md#principled-implementation Unit-image x and y retain photograph observations independently of capture pixel dimensions.
 * @evidence contracts/common.md#clear-and-simple-design Coordinates and landmark group are the complete overlay observation record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed markers are supplied reference data and never determine anatomical vertices or acceptance.
 *
 * @author Samchon
 */
export interface IHumanViewerLandmark {
  /** Horizontal position, 0 at the left edge and 1 at the right. */
  x: number;

  /** Vertical position, 0 at the top edge and 1 at the bottom. */
  y: number;

  /** Landmark group name. */
  group: string;
}
