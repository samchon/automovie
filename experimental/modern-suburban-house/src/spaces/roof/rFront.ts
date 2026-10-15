import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { RIGHT_WALL_HEIGHT } from "./RIGHT_WALL_HEIGHT";
import { RIGHT_PITCH } from "./RIGHT_PITCH";

/** Right low roof front face (same walls and ridge, 5.95 at the wall line, 7/12). */

export const rFront = (z: number): number => RIGHT_WALL_HEIGHT - RIGHT_PITCH * (z - MAIN_OUTLINE.outer.z[1]);
