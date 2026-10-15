import { datum } from "../datum";
import { canopyMaxZ } from "./canopyMaxZ";
import { canopyMinZ } from "./canopyMinZ";

const canopyMinX = datum.minX - 0.3;
const canopyMaxX = datum.maxX + 0.3;
/**
 * Plan extent of the roof canopy, 0.3 m past the house on three sides and 0.7 m at the front, with
 * its girder and support x-positions and cassette counts per axis.
 */
export const canopy = {
  minX: canopyMinX,
  maxX: canopyMaxX,
  minZ: canopyMinZ,
  maxZ: canopyMaxZ,
  girders: [-5.4, 0, 5.4],
  supports: [-4.8, 0, 4.8],
  nx: Math.ceil((canopyMaxX - canopyMinX) / 1.2),
  nz: Math.ceil((canopyMaxZ - canopyMinZ) / 1.9),
};
