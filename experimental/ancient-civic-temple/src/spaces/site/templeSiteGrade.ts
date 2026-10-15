import { templeSiteGradePlane } from "./templeSiteGradePlane";



/** Ground height at world `z`. */
export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};
