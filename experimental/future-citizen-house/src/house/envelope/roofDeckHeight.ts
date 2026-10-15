import { datum } from "../datum";

export const roofDeckHeight = (x: number) => datum.roof + 0.03 + 0.01 * (x - datum.minX);
