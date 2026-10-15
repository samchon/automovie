import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { mBack } from "./mBack";
import { mFront } from "./mFront";

/** Main roof weather surface at any Z (front or back of the ridge). */
export const mainRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? mFront(z)
  : mBack(z));
