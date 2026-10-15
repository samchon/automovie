import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Pale stone countertop surfaces of the fixed cabinetry. */
export const lightCountertop = {
  material: houseMaterial("light-countertop", "#E4E0D8", 0.30),
  faces: ["countertop", "top"],
  modelBindings: [{ model: "fitting:kitchen-", faces: ["countertop"] }, { model: "fitting:vanity-", faces: ["countertop"] }, { model: "fitting:laundry-top", faces: ["top"] }],
} satisfies HouseFinish;
