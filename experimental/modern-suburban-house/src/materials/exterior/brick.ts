/** Fired clay brick and mortar joint mask on plinth, chimney and fireplace. */
import { houseMaterial, type HouseFinish } from "../finish";

export const brick = {
  material: houseMaterial("brick-red-brown", "#8A4A3A", 0.85),
  faces: ["brick-face", "plinth", "chimney-body", "fireplace-body"],
  // The image contains two 0.20 x 0.065 m staggered modules per repeat.
  texture: { file: "brick.png", metres: [0.4, 0.13], projection: "wall" },
} satisfies HouseFinish;

/** Mortar is a colour and normal mask on brick faces, never a separate face. */
export const brickMortar = houseMaterial("brick-mortar", "#BDB5A8", 0.92);
