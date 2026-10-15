import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Privacy-etched bathroom glass, sharing the clear glass's tint and IOR. */
export const obscureGlass = {
  material: houseMaterial("glass-obscure", "#E8EEF0", 0.55, {
    transmission: 0.8,
    ior: 1.5,
    thickness: 0.006,
    doubleSided: true,
  }),
  faces: ["obscured-glass"],
  modelBindings: [{ model: "window:", faces: ["obscured-glass"] }],
  texture: {
    file: "obscured-glass.png",
    metres: [0.002, 0.002],
    projection: "local",
  },
} satisfies HouseFinish;
