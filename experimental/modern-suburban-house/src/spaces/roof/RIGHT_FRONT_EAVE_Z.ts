import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { OVERHANG } from "./OVERHANG";

/** Front free edge of the lower right roof, independently set by its own reach. */
export const RIGHT_FRONT_EAVE_Z = MAIN_OUTLINE.outer.z[1] + OVERHANG.right;
