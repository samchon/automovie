import type { IAutoMovieMesh } from "@automovie/interface";
import { heightRegion } from "./heightRegion";


/**
 * Mesh of a vertical pipe wall sector between radii 0.05 and 0.055 m around plan point `x, z`, from
 * angle `start` to `end` and height `bottom` to `top`.
 */
export function pipeSector(x: number, z: number, bottom: number, top: number, start: number, end: number): IAutoMovieMesh {
  const count = Math.ceil((end - start) / (Math.PI / 16));
  const arc = (radius: number) => Array.from({ length: count + 1 }, (_, i) => ({ x: x + radius * Math.cos(start + (end - start) * i / count), y: z + radius * Math.sin(start + (end - start) * i / count) }));
  return heightRegion([...arc(0.055), ...arc(0.05).reverse()], () => bottom, () => top);
}
