import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { OVERHANG } from "./OVERHANG";

/** Front edge of the high main roof: the front wall plus its free overhang. */
export const FRONT_EAVE_Z = MAIN_OUTLINE.outer.z[1] + OVERHANG.main;
