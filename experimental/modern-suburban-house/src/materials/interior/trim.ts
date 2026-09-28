/** Semi-gloss painted trim, door leaves, stair risers, and built-in shelves. */
import { houseMaterial, type HouseFinish } from "../finish";

export const interiorTrim = {
  material: houseMaterial("interior-trim-white", "#F4F2EC", 0.35),
  faces: [
    "leaf",
    "leaf-panel",
    "jamb-a",
    "jamb-b",
    "jamb-core",
    "casing-a",
    "casing-b",
    "casing",
    "wall-baseboard",
    "stair-skirt",
    "interior-sill",
    "interior-casing",
    "stair-riser",
    "newel",
    "closet-leaf",
    "closet-shelf",
    "shelf",
  ],
  modelBindings: [
    {
      model: "interior-door:",
      faces: [
        "leaf",
        "leaf-panel",
        "jamb-a",
        "jamb-b",
        "jamb-core",
        "casing-a",
        "casing-b",
      ],
    },
    { model: "exterior-door:front-door", faces: ["casing"] },
    { model: "exterior-door:garden-door", faces: ["casing"] },
    { model: "window:", faces: ["interior-sill", "interior-casing"] },
    { model: "baseboard:", faces: ["wall-baseboard"] },
    { model: "stair-skirt", faces: ["stair-skirt"] },
    { model: "closet:", faces: ["leaf", "leaf-panel", "casing", "shelf"] },
    { model: "fitting:bedroom-sliding-closet", faces: ["carcass", "casing", "leaf", "shelf"] },
    { model: "fitting:wardrobe-", faces: ["carcass", "shelf"] },
  ],
} satisfies HouseFinish;
