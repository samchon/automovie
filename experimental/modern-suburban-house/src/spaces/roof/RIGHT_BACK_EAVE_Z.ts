import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { OVERHANG } from "./OVERHANG";

/** Rear free edge of the lower right roof, independently set by its own reach. */
export const RIGHT_BACK_EAVE_Z = MAIN_OUTLINE.outer.z[0] - OVERHANG.right;
