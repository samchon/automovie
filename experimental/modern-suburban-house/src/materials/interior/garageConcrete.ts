import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Garage floor concrete. */
export const garageConcrete = {
  material: houseMaterial("garage-concrete", "#9C9890", 0.85),
  faces: ["garage-floor"],
  texture: { file: "garage.png", metres: [0.5, 0.5], projection: "ground" },
} satisfies HouseFinish;
