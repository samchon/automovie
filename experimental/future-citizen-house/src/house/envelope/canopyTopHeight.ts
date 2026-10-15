import { canopySoffitHeight } from "./canopySoffitHeight";

/** Height of the canopy's top surface at depth `z`, 0.161 m above its soffit. */
export const canopyTopHeight = (z: number) => canopySoffitHeight(z) + 0.161;
