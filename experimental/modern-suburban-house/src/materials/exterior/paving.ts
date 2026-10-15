import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Broom-finished site concrete on the walks, driveway and terrace; the porch slab keeps its own `porchFloor` values. */
export const paving = {
  material: houseMaterial("paving-concrete", "#B4B0A8", 0.88),
  faces: ["front-walk", "driveway", "side-walk", "terrace"],
  texture: { file: "concrete.png", metres: [0.5, 0.5], projection: "ground" },
} satisfies HouseFinish;
