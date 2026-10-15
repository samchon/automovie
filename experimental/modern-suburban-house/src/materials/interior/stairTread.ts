import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Oak tread faces and the continuous darker handrail over the L stair. */
export const stairTread = {
  material: houseMaterial("stair-tread-wood", "#B08050", 0.5),
  faces: ["stair-tread-top", "stair-tread-nose", "stair-landing"],
  texture: { file: "oak.png", metres: [0.13, 1.2], projection: "local" },
} satisfies HouseFinish;

