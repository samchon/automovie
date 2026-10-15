import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Silver-backed plate; the live viewer realizes its authored planar reflection. */

export const mirrorSilver = {
  material: houseMaterial("mirror-silver", "#EDEDED", .02, { metallic: 1 }),
  faces: ["mirror"],
  modelBindings: [{ model: "fitting:mirror-", faces: ["mirror"] }],
} satisfies HouseFinish;
