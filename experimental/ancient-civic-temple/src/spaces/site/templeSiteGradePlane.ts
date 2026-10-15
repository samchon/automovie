import type { HeightPlane } from "../../geometry/HeightPlane";
import { templeLevels as y } from "../templeLevels";
import { templeSiteGradeBreaks } from "./templeSiteGradeBreaks";



/**
 * Grade height field at world `z`: level at the service approach north of the first break, level at
 * the public road south of the second, and a straight fall between.
 */
export const templeSiteGradePlane = (z: number): HeightPlane => {
  const [north, south] = templeSiteGradeBreaks;
  if (z <= north) return { x: 0, z: 0, constant: y.serviceApproach };
  if (z >= south) return { x: 0, z: 0, constant: y.publicRoad };
  const slope = (y.publicRoad - y.serviceApproach) / (south - north);
  return { x: 0, z: slope, constant: y.serviceApproach - slope * north };
};
