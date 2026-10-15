import type { RoofRules } from "../../geometry/RoofRules";

/**
 * Heights, thickness and projection use m; slopes use rad. Open-yard logical caps consume courtEave.
 */

export const templeRoofRules: RoofRules = {
  courtEave: 3.2,
  leanSlope: 12 * Math.PI / 180,
  gableSlope: 22 * Math.PI / 180,
  eastGableSlope: 19 * Math.PI / 180,
  normalThickness: 0.18,
  overhang: 0.35,
  eastWallSupport: 3.55,
  sanctuarySupport: 5.35,
  porchSupport: 4,
};
