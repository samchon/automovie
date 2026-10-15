import type { HeightPlane } from "../geometry/HeightPlane";
import type { PlanPoint } from "../geometry/PlanPoint";


export interface ScanSolid {
  /** A shared group whose internal overlaps are excluded, such as one wall or roof patch. */
  group: string;
  polygon: PlanPoint[];
  bottom: HeightPlane;
  top: HeightPlane;
}
