import type { HeightPlane } from "./HeightPlane";
import type { PlanPoint } from "./PlanPoint";
import { WallSegment } from "./WallSegment";

/** One column's real top plane and vertical interval. */

export interface WallColumn {
  /** Convex plan outline of the column. */
  polygon: PlanPoint[];
  /** Height field of the column's top. */
  top: HeightPlane;
  /**
   * Solid vertical intervals of the column, bottom to top; openings leave gaps between them.
   * `uppermost` marks the interval that reaches the top.
   */
  intervals: Array<{ bottom: HeightPlane; top: HeightPlane; uppermost: boolean; }>;
  /** Wall segment the column lies in. */
  segment: WallSegment;
}
