import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Clear plate glass and privacy etched bathroom glass share tint and IOR. */
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

