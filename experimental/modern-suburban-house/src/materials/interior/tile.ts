/** Glazed bathroom and backsplash tile; grout is a mask on the same UV faces. */
import { houseMaterial, type HouseFinish } from "../finish";

export const floorTile = {
  material: houseMaterial("bath-floor-tile", "#D8D4CC", 0.4),
  faces: ["powder-floor", "shower-bath-floor", "tub-bath-floor"],
  texture: { file: "tile.png", metres: [0.3, 0.3], projection: "ground" },
} satisfies HouseFinish;

export const wallTile = {
  material: houseMaterial("bath-wall-tile", "#EEEDEA", 0.3),
  faces: ["shower-wall", "tub-surround-wall", "kitchen-backsplash"],
  texture: { file: "wall-tile.png", metres: [0.3, 0.1], projection: "wall" },
} satisfies HouseFinish;

/** Shared mortar optical response sampled by floor and wall tile masks. */
export const tileGrout = houseMaterial("tile-grout", "#A9A39A", 0.9);
