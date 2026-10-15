import { datum } from "./datum";
import { Rect } from "./Rect";

/** The four exterior wall strips between the outline and the inner clear face;
 * the long front/rear strips carry the corner squares. */
export const exteriorWallZone = (): [string, Rect][] => [
  ["front", [datum.minX, datum.maxX, datum.minZ, -datum.innerZ]],
  ["rear", [datum.minX, datum.maxX, datum.innerZ, datum.maxZ]],
  ["left", [datum.innerX, datum.maxX, -datum.innerZ, datum.innerZ]],
  ["right", [datum.minX, -datum.innerX, -datum.innerZ, datum.innerZ]],
];
