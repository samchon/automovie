/** Oiled oak entry leaf and powder-coated segmented garage leaf. */
import { houseMaterial, type HouseFinish } from "../finish";

export const frontDoor = {
  material: houseMaterial("front-door-wood", "#9A6A3E", 0.5),
  faces: ["leaf-exterior", "leaf-interior", "leaf-edge", "leaf-panel"],
  modelBindings: [
    {
      model: "exterior-door:front-door",
      faces: ["leaf-exterior", "leaf-interior", "leaf-edge", "leaf-panel"],
    },
  ],
  texture: {
    file: "front-door-oak.png",
    metres: [0.15, 0.8],
    projection: "local",
  },
} satisfies HouseFinish;

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
