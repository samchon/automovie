/**
 * Roof-contact heights shared by column and beam prototypes. The reviewed
 * roof rules own support, slope and slab thickness; model dimensions own the
 * offset from the court edge and the rafter's normal depth. Returned heights
 * are world metres, so a change also invalidates their mutual contact.
 */
import { templeRoofRules } from "../spaces/roofs/assembly";

export const colonnadeBeamTop = (slope: number): number => {
  const courtEdgeToBeamInner = 0.175 - 0.26 / 2;
  const rafterNormalDepth = 0.12;
  return templeRoofRules.courtEave
    + courtEdgeToBeamInner * Math.tan(slope)
    - (templeRoofRules.normalThickness + rafterNormalDepth) / Math.cos(slope);
};
