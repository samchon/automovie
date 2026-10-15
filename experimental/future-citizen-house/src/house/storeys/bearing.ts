import { datum } from "../datum";
import type { Rect } from "../Rect";

/** A floor slab inside the enclosure bears to the exterior wall centreline, so
 * its edge stays buried in the facade body instead of repeating the outer face
 * that the facade owner already closes (settings/003#surface-decomposition). */
export const bearing: Rect = [
  (datum.minX - datum.innerX) / 2,
  (datum.maxX + datum.innerX) / 2,
  (datum.minZ - datum.innerZ) / 2,
  (datum.maxZ + datum.innerZ) / 2,
];
