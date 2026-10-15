import { STOREYS } from "../STOREYS";
import { GROUND_LAYERS } from "../GROUND_LAYERS";

/** The entry plan owns the front threshold span consumed by wall, base and porch. */
export const FRONT_DOOR = {
  id: "front-door",
  from: 0.4,
  to: 1.4,
  bottom: STOREYS.groundFloor - GROUND_LAYERS.finish - GROUND_LAYERS.base,
  top: 2.2,
} as const;
