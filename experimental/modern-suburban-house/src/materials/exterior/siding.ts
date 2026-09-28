/** Factory-painted warm-white lap siding on the exterior envelope faces. */
import { type HouseFinish, houseMaterial } from "../finish";

export const siding = {
  material: houseMaterial("siding-warm-white", "#EDE8DC", 0.55),
  faces: [
    "siding-face",
    "siding-butt",
    "siding-back",
    "siding-top",
    "siding-cut",
  ],
  modelBindings: [
    {
      model: "siding:",
      faces: [
        "siding-face",
        "siding-butt",
        "siding-back",
        "siding-top",
        "siding-cut",
      ],
    },
    {
      model: "envelope/",
      faces: [
        "siding-face",
        "siding-butt",
        "siding-back",
        "siding-top",
        "siding-cut",
      ],
    },
  ],
  texture: { file: "siding.png", metres: [1, 0.15], projection: "wall" },
} satisfies HouseFinish;
