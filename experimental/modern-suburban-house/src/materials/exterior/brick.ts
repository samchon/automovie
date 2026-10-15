import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Fired clay brick on the plinth, chimney and fireplace; `brickMortar` masks its joints. */
export const brick = {
  material: houseMaterial("brick-red-brown", "#8A4A3A", 0.85),
  faces: ["brick-face", "plinth", "chimney-body", "fireplace-body"],
  // The image contains two 0.20 x 0.065 m staggered modules per repeat.
  texture: { file: "brick.png", metres: [0.4, 0.13], projection: "wall" },
} satisfies HouseFinish;

