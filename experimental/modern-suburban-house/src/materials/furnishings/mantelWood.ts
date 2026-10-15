import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Wood mantel of the fireplace. */
export const mantelWood = { material: houseMaterial("mantel-wood", "#A87A4E", .5), faces: ["mantel"], modelBindings: [{ model: "fitting:fireplace", faces: ["mantel"] }] } satisfies HouseFinish;
