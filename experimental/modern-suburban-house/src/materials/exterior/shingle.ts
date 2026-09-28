/** Mineral-granule asphalt shingles on roof and porch weather faces. */
import { type HouseFinish, houseMaterial } from "../finish";

export const shingle = {
  material: houseMaterial("roof-shingle", "#3A3C3E", 0.9),
  faces: [
    "shingle-face",
    "shingle-butt",
    "shingle-back",
    "shingle-cut",
    "roof-weather",
    "porch-roof-weather",
  ],
  modelBindings: [
    {
      model: "roof:",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
    {
      model: "roof/",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
    {
      model: "porch.ts-shingle-",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
    {
      model: "main-shingle-ridge",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
    {
      model: "right-shingle-ridge",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
    {
      model: "garage-shingle-ridge",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
    {
      model: "front-gable-shingle-ridge",
      faces: ["shingle-face", "shingle-butt", "shingle-back", "shingle-cut"],
    },
  ],
  texture: { file: "shingle.png", metres: [0.66, 0.28], projection: "roof" },
} satisfies HouseFinish;
