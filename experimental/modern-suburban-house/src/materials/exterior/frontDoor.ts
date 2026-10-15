import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Oiled oak entry door leaf. */
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

