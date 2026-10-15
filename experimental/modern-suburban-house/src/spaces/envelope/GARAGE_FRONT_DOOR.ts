import { STOREYS } from "../STOREYS";
import { GROUND_LAYERS } from "../GROUND_LAYERS";

/** Rough garage opening; room fit-out reserves the guide from this host. */
export const GARAGE_FRONT_DOOR = {
  id: "garage-front-door",
  from: 6.1,
  to: 11.1,
  bottom: STOREYS.garageFloor - GROUND_LAYERS.garageBase,
  top: 2.15,
} as const;
