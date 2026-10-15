import { MAIN_RIDGE_Z } from "./MAIN_RIDGE_Z";
import { rBack } from "./rBack";
import { rFront } from "./rFront";

/** Right low roof weather surface at any Z. */
export const rightRoof = (z: number): number => (z >= MAIN_RIDGE_Z
  ? rFront(z)
  : rBack(z));
