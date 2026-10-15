import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Glazed bathroom floor tile; `tileGrout` masks its joints on the same UV faces. */
export const floorTile = {
  material: houseMaterial("bath-floor-tile", "#D8D4CC", 0.4),
  faces: ["powder-floor", "shower-bath-floor", "tub-bath-floor"],
  texture: { file: "tile.png", metres: [0.3, 0.3], projection: "ground" },
} satisfies HouseFinish;

