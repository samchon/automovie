import { templeSiteGradePlane } from "./templeSiteGradePlane";



export const templeSiteGrade = (z: number): number => {
  const plane = templeSiteGradePlane(z);
  return plane.z * z + plane.constant;
};
