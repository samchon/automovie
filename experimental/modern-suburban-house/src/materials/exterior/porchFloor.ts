import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Porch slab concrete. */
export const porchFloor = {
  material: houseMaterial("porch-floor", "#A8A49C", 0.8),
  faces: ["porch-top", "porch-riser", "porch-side"],
  texture: { file: "porch.png", metres: [0.4, 0.4], projection: "ground" },
} satisfies HouseFinish;
