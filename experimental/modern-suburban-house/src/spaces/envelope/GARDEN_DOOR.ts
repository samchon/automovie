import { STOREYS } from "../STOREYS";
import { GROUND_LAYERS } from "../GROUND_LAYERS";

/** Bottom of the ground base reservation the wall leaves under the garden door (10). */
const SILL = STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base;
/** Rear door to the garden terrace. */
export const GARDEN_DOOR = {
  id: "garden-door",
  from: -1.2,
  to: 1.2,
  bottom: SILL,
  top: 2.25,
} as const;
