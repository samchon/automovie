import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Flat white paint on all room and garage ceilings. */
export const interiorCeilings = {
  material: houseMaterial("interior-ceiling", "#FAF9F6", 0.65),
  faces: ["ceiling", "stair-upper-ceiling", "garage-ceiling"],
} satisfies HouseFinish;
