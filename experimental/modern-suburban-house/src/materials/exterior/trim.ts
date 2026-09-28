/** Semi-gloss exterior trim, fascia, soffit, porch columns and jambs. */
import { type HouseFinish, houseMaterial } from "../finish";

export const trim = {
  material: houseMaterial("trim-white", "#F6F4EE", 0.35),
  faces: [
    "exterior-trim",
    "jamb",
    "fascia",
    "soffit",
    "porch-column",
    "porch-beam",
    "front-door-threshold",
    "garden-door-threshold",
  ],
  modelBindings: [
    { model: "exterior-trim:", faces: ["exterior-trim"] },
    { model: "exterior-corner-", faces: ["exterior-trim"] },
    { model: "window:", faces: ["exterior-trim"] },
    { model: "exterior-door:front-door", faces: ["jamb", "exterior-trim"] },
    { model: "exterior-door:garden-door", faces: ["jamb", "exterior-trim"] },
    {
      model: "garage-door:garage-front-door",
      faces: ["jamb", "exterior-trim"],
    },
  ],
  texture: {
    file: "exterior-trim.png",
    metres: [0.1, 0.1],
    projection: "local",
  },
} satisfies HouseFinish;
