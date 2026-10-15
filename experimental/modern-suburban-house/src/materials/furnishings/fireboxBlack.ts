import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Black firebox and firebox trim of the closed fireplace. */
export const fireboxBlack = { material: houseMaterial("firebox-black", "#1F1F20", .9), faces: ["firebox", "firebox-trim"], modelBindings: [{ model: "fitting:fireplace", faces: ["firebox", "firebox-trim"] }] } satisfies HouseFinish;
