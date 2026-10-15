import { GARAGE_RIDGE_Z } from "./GARAGE_RIDGE_Z";
import { gBack } from "./gBack";
import { gFront } from "./gFront";

/** Garage roof weather surface at any Z. */
export const garageRoof = (z: number): number => (z >= GARAGE_RIDGE_Z
  ? gFront(z)
  : gBack(z));
