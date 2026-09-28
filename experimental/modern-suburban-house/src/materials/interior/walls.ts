/** Matte gypsum-board paint on every interior wall outside tiled zones. */
import { houseMaterial, type HouseFinish } from "../finish";

export const interiorWalls = {
  material: houseMaterial("interior-wall-paint", "#F1EEE6", 0.6),
  faces: ["interior-wall", "garage-interior-wall", "partition"],
} satisfies HouseFinish;
