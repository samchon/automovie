import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";

/** Garage ridge Z: mean of the garage front and back walls (roof-mass-allocation). */

export const GARAGE_RIDGE_Z = (GARAGE_OUTLINE.outer.z[1] + GARAGE_OUTLINE.outer.z[0]) / 2;
