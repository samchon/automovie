import type { HeightPlane } from "../geometry/HeightPlane";
import type { PlanPoint } from "../geometry/PlanPoint";


/** One convex solid of the envelope overlap scan: a plan polygon between two height fields. */
export interface ScanSolid {
  /** A shared group whose internal overlaps are excluded, such as one wall or roof patch. */
  group: string;
  /** Convex plan outline of the solid. */
  polygon: PlanPoint[];
  /** Height field of the solid's bottom. */
  bottom: HeightPlane;
  /** Height field of the solid's top. */
  top: HeightPlane;
}
