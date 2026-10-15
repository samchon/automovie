import { datum } from "../datum";
import type { Frame } from "../Frame";

/** Exterior frame centres and depths derive from the outer and clear edges. */

export function exteriorFrame(
  face: "front" | "rear" | "left" | "right"
): Frame {
  const along = face === "front" || face === "rear" ? "x" : "z";
  const normal: 1 | -1 = face === "rear" || face === "left" ? 1 : -1;
  const edge = face === "front"
    ? datum.minZ
    : face === "rear"
      ? datum.maxZ
      : face === "left"
        ? datum.maxX
        : datum.minX;
  const clear = face === "front"
    ? -datum.innerZ
    : face === "rear"
      ? datum.innerZ
      : face === "left"
        ? datum.innerX
        : -datum.innerX;
  const plane = (edge + clear) / 2;
  const span = along === "x" ? datum.innerX : datum.innerZ;
  return {
    id: face + "-face",
    along,
    normal,
    plane,
    a: -span,
    b: span,
    floor: datum.floors[0],
    top: datum.ceilings[1],
    depth: Math.abs(edge - clear),
    spaces: ["house"],
  };
}
