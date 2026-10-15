import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Beige carpet on bedroom floors. */
export const carpet = {
  material: houseMaterial("beige-carpet", "#CDBFA6", 0.95),
  faces: [
    "upper-hall-floor",
    "primary-floor",
    "wardrobe-floor",
    "bedroom-two-floor",
    "bedroom-three-floor",
  ],
  texture: { file: "carpet.png", metres: [0.01, 0.01], projection: "ground" },
} satisfies HouseFinish;
