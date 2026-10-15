import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { GARAGE_WALL_HEIGHT } from "./GARAGE_WALL_HEIGHT";
import { GARAGE_PITCH } from "./GARAGE_PITCH";

/** Garage front face. */

export const gFront = (z: number): number => GARAGE_WALL_HEIGHT - GARAGE_PITCH * (z - GARAGE_OUTLINE.outer.z[1]);
