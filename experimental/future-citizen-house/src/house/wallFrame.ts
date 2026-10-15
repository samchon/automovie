import { datum } from "./datum";
import { Frame } from "./Frame";
import type { Wall } from "./Wall";

export function wallFrame(w: Wall): Frame {
  return { id: w.id, along: w.axis === "x" ? "z" : "x", normal: 1, plane: w.plane, a: w.a, b: w.b, floor: datum.floors[w.level], top: datum.ceilings[w.level], depth: datum.wall, spaces: w.adjacent };
}
