import { datum } from "../datum";
import { canopy } from "./canopy";


export const canopySoffitHeight = (z: number) => datum.roof + 0.3 + 0.01 * (canopy.maxZ - z);
