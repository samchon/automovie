import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Porch slab and broom-finished site concrete retain different values. */
export const paving = {
  material: houseMaterial("paving-concrete", "#B4B0A8", 0.88),
  faces: ["front-walk", "driveway", "side-walk", "terrace"],
  texture: { file: "concrete.png", metres: [0.5, 0.5], projection: "ground" },
} satisfies HouseFinish;
