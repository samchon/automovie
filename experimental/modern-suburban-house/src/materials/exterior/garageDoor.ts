import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Powder-coated charcoal segmented garage door leaf. */
export const garageDoor = {
  material: houseMaterial("garage-door-charcoal", "#34373A", 0.45),
  faces: ["leaf-exterior", "leaf-interior", "leaf-panel", "panel-edge"],
  modelBindings: [
    {
      model: "garage-door:garage-front-door",
      faces: ["leaf-exterior", "leaf-interior", "leaf-panel", "panel-edge"],
    },
  ],
  texture: {
    file: "garage-door-steel.png",
    metres: [0.25, 0.25],
    projection: "local",
  },
} satisfies HouseFinish;
