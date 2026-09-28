/** Clear plate glass and privacy etched bathroom glass share tint and IOR. */
import { houseMaterial, type HouseFinish } from "../finish";

export const clearGlass = {
  material: houseMaterial("glass-clear", "#E8EEF0", 0.03, {
    transmission: 0.92,
    ior: 1.5,
    thickness: 0.006,
    doubleSided: true,
  }),
  faces: ["glass"],
  modelBindings: [
    { model: "window:", faces: ["glass"] },
    { model: "exterior-door:front-door", faces: ["glass"] },
    { model: "exterior-door:garden-door", faces: ["glass"] },
    { model: "garage-door:garage-front-door", faces: ["glass"] },
    { model: "fitting:shower-booth", faces: ["glass"] },
  ],
} satisfies HouseFinish;

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
