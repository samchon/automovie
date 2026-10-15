import type { HeightPlane } from "./HeightPlane";
import type { PlanPoint } from "./PlanPoint";
import { WallSegment } from "./WallSegment";

/** One column's real top plane and vertical interval. */

export interface WallColumn {
  polygon: PlanPoint[];
  top: HeightPlane;
  intervals: Array<{ bottom: HeightPlane; top: HeightPlane; uppermost: boolean; }>;
  segment: WallSegment;
}
