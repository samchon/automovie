import { datum } from "../datum";
import { canopy } from "./canopy";


/**
 * Height of the canopy soffit at depth `z`: 0.3 m above the roof datum at the rear edge, rising 1%
 * toward the front.
 */
export const canopySoffitHeight = (z: number) => datum.roof + 0.3 + 0.01 * (canopy.maxZ - z);
