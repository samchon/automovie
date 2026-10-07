/**
 * One observed landmark of a reference photograph, in unit image coordinates.
 *
 * @evidence contracts/common.md#meaningful-documentation States the coordinate convention.
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
