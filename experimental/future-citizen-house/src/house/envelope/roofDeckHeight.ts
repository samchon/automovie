import { datum } from "../datum";

/**
 * Height of the waterproof roof deck at world `x`: 0.03 m above the roof datum at the minimum-x
 * edge, rising 1% toward +x so water falls to the gutter.
 */
export const roofDeckHeight = (x: number) => datum.roof + 0.03 + 0.01 * (x - datum.minX);
