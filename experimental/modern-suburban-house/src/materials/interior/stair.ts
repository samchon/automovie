/** Oak tread faces and the continuous darker handrail over the L stair. */
import { houseMaterial, type HouseFinish } from "../finish";

export const stairTread = {
  material: houseMaterial("stair-tread-wood", "#B08050", 0.5),
  faces: ["stair-tread-top", "stair-tread-nose", "stair-landing"],
  texture: { file: "oak.png", metres: [0.13, 1.2], projection: "local" },
} satisfies HouseFinish;

export const handrail = {
  material: houseMaterial("handrail-wood", "#8A5A34", 0.45),
  faces: ["stair-handrail", "upper-hall-handrail"],
} satisfies HouseFinish;
