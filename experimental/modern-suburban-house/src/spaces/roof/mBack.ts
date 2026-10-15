import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { MAIN_PITCH } from "./MAIN_PITCH";
import { MAIN_WALL_HEIGHT } from "./MAIN_WALL_HEIGHT";

/** Main roof back face. */

export const mBack = (z: number): number => MAIN_WALL_HEIGHT + MAIN_PITCH * (z - MAIN_OUTLINE.outer.z[0]);
