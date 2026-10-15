import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Oak tread and landing faces of the L stair; the handrail takes `handrail`. */
export const stairTread = {
  material: houseMaterial("stair-tread-wood", "#B08050", 0.5),
  faces: ["stair-tread-top", "stair-tread-nose", "stair-landing"],
  texture: { file: "oak.png", metres: [0.13, 1.2], projection: "local" },
} satisfies HouseFinish;

