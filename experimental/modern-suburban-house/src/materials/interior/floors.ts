/** Room floors use one finish per actual floor assembly and threshold. */
import { houseMaterial, type HouseFinish } from "../finish";

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

export const laundryFloor = {
  material: houseMaterial("laundry-floor", "#C9C4BA", 0.5),
  faces: ["laundry-floor", "mudroom-threshold-riser"],
} satisfies HouseFinish;

export const garageConcrete = {
  material: houseMaterial("garage-concrete", "#9C9890", 0.85),
  faces: ["garage-floor"],
  texture: { file: "garage.png", metres: [0.5, 0.5], projection: "ground" },
} satisfies HouseFinish;
