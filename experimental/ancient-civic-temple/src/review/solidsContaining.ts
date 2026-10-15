import { planeHeight } from "../geometry/planeHeight";
import { strictlyInside } from "./strictlyInside";
import { ScanSolid } from "./ScanSolid";

/** Finds solids containing a point in plan and between bottom and top, for observation-position checks. */

export const solidsContaining = (solids: readonly ScanSolid[], at: { x: number; y: number; z: number; }): string[] => solids.filter((solid) => strictlyInside(solid.polygon, at, 1e-4) &&
  at.y > planeHeight(solid.bottom, at) + 1e-4 && at.y < planeHeight(solid.top, at) - 1e-4).map((solid) => solid.group);
