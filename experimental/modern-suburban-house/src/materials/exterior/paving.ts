/** Porch slab and broom-finished site concrete retain different values. */
import { houseMaterial, type HouseFinish } from "../finish";

export const porchFloor = {
  material: houseMaterial("porch-floor", "#A8A49C", 0.8),
  faces: ["porch-top", "porch-riser", "porch-side"],
  texture: { file: "porch.png", metres: [0.4, 0.4], projection: "ground" },
} satisfies HouseFinish;

export const paving = {
  material: houseMaterial("paving-concrete", "#B4B0A8", 0.88),
  faces: ["front-walk", "driveway", "side-walk", "terrace"],
  texture: { file: "concrete.png", metres: [0.5, 0.5], projection: "ground" },
} satisfies HouseFinish;
