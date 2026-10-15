import type { IAutoMovieMesh } from "@automovie/interface";
import { cross } from "./cross";
import { Frame } from "./Frame";
import { rotationOf } from "./rotationOf";
import { Vec } from "./Vec";

/** The weather plane and outward direction belong to the wall's source owner. */

export const facadeFrame = (id: string, mesh: IAutoMovieMesh): Frame => {
  const values = (axis: number) => mesh.positions.filter((_, i) => i % 3 === axis);
  const side = id.startsWith("front-")
    ? "front"
    : id.startsWith("rear-")
      ? "rear"
      : id.startsWith("left-")
        ? "left"
        : id.startsWith("right-")
          ? "right"
          : null;
  if (side === null) throw new Error(`unassigned facade wall: ${id}`);
  const u: Vec = side === "front"
    ? [1, 0, 0]
    : side === "rear"
      ? [-1, 0, 0]
      : side === "left"
        ? [0, 0, 1]
        : [0, 0, -1];
  const v: Vec = [0, 1, 0], n = cross(u, v);
  const plane = side === "front"
    ? Math.max(...values(2))
    : side === "rear"
      ? Math.min(...values(2))
      : side === "left"
        ? Math.min(...values(0))
        : Math.max(...values(0));
  const origin: Vec = side === "front" || side === "rear" ? [0, 0, plane] : [plane, 0, 0];
  return { origin, u, v, n, rotation: rotationOf(u, v, n) };
};
