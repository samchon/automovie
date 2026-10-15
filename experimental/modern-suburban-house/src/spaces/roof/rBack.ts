import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { RIGHT_WALL_HEIGHT } from "./RIGHT_WALL_HEIGHT";
import { RIGHT_PITCH } from "./RIGHT_PITCH";

/** Right low roof back face. */

export const rBack = (z: number): number => RIGHT_WALL_HEIGHT + RIGHT_PITCH * (z - MAIN_OUTLINE.outer.z[0]);
