import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Darker wood of the continuous stair handrail. */
export const handrail = {
  material: houseMaterial("handrail-wood", "#8A5A34", 0.45),
  faces: ["stair-handrail", "upper-hall-handrail"],
} satisfies HouseFinish;
