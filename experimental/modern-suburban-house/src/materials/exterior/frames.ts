/** Powder-coated charcoal window members, gutter and roof metalwork. */
import { houseMaterial, type HouseFinish } from "../finish";

export const frames = {
  material: houseMaterial("charcoal-metal", "#2E3033", 0.4),
  faces: [
    "frame",
    "sash",
    "mullion",
    "muntin",
    "gutter",
    "downspout",
    "roof-flashing",
    "chimney-cap",
    "leaf-exterior",
    "leaf-interior",
    "leaf-edge",
  ],
  modelBindings: [
    { model: "window:", faces: ["frame", "sash", "mullion", "muntin"] },
    { model: "exterior-door:front-door", faces: ["muntin"] },
    {
      model: "exterior-door:garden-door",
      faces: ["leaf-exterior", "leaf-interior", "leaf-edge", "sash", "muntin"],
    },
    { model: "garage-door:garage-front-door", faces: ["sash"] },
    { model: "roof:", faces: ["roof-flashing"] },
    { model: "gutter:", faces: ["gutter", "downspout"] },
  ],
  texture: {
    file: "charcoal-frame.png",
    metres: [0.05, 0.05],
    projection: "local",
  },
} satisfies HouseFinish;
