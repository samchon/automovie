import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Muted cloth on the small hanging-garment blocking proxies. */

export const storedCloth = {
  material: houseMaterial("stored-cloth", "#B7AFA3", 0.92),
  faces: ["clothes"],
  modelBindings: [
    { model: "fitting:bedroom-sliding-closet", faces: ["clothes"] },
    { model: "fitting:wardrobe-hanging", faces: ["clothes"] },
  ],
} satisfies HouseFinish;
