import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";


/** Glazed bathroom wall tile. */
export const wallTile = {
  material: houseMaterial("bath-wall-tile", "#EEEDEA", 0.3),
  faces: ["shower-wall", "tub-surround-wall", "kitchen-backsplash"],
  texture: { file: "wall-tile.png", metres: [0.3, 0.1], projection: "wall" },
} satisfies HouseFinish;
