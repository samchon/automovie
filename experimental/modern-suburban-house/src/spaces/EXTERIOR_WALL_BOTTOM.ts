import { STOREYS } from "./STOREYS";

/**
 * Provisional bottom of exterior wall faces: the front walk datum −0.45 m, the
 * lowest authored exterior surface. The real support bottom waits for the maps
 * ground input ; this value only
 * keeps the elevation closed down to the authored paving and is not a
 * foundation depth.
 */

export const EXTERIOR_WALL_BOTTOM = STOREYS.frontWalk;
