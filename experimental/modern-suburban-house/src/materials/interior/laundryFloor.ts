import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Laundry room floor. */
export const laundryFloor = {
  material: houseMaterial("laundry-floor", "#C9C4BA", 0.5),
  faces: ["laundry-floor", "mudroom-threshold-riser"],
} satisfies HouseFinish;
