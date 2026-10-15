import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { OVERHANG } from "./OVERHANG";

/** Back edge of the high main roof. */
export const BACK_EAVE_Z = MAIN_OUTLINE.outer.z[0] - OVERHANG.main;
