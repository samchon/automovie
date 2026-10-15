import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Room floors use one finish per actual floor assembly and threshold. */
export const oakFloor = {
  material: houseMaterial("oak-floor", "#B08050", 0.5),
  faces: [
    "entry-floor",
    "living-floor",
    "common-floor",
    "service-floor",
    "pantry-floor",
  ],
  texture: { file: "oak.png", metres: [0.13, 1.2], projection: "ground" },
} satisfies HouseFinish;

