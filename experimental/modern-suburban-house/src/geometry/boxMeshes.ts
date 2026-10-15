/** Explicit metric door mesh operations; the three door owners select their geometry. */
import type {
  IAutoMovieMesh,
} from "@automovie/interface";
import { Box } from "./Box";
import { Face } from "./Face";
import { Vec3 } from "./Vec3";
import { empty } from "./empty";
import { quad } from "./quad";

/** One closed member, optionally split by the three material-facing families. */
export const boxMeshes = (b: Box, front: Face, back = front, edge = front,
  length: "x" | "y" | null = null): readonly [Face, IAutoMovieMesh][] => {
  const [x0, x1, y0, y1, z0, z1] = b;
  if (![...b].every(Number.isFinite) || x1 <= x0 || y1 <= y0 || z1 <= z0)
    throw new Error(`invalid exterior-door member: ${b.join(",")}`);
  const groups = new Map<Face, IAutoMovieMesh>();
  const face = (id: Face, points: readonly Vec3[], n: Vec3): void => {
    const mesh = groups.get(id) ?? empty();
    groups.set(id, mesh);
    quad(mesh, points, n, ([x, y, z]) => {
      if (length === "y") return [y - y0, Math.abs(n[2]) === 1 ? x - x0 : z - z0];
      if (length === "x") return [x - x0, Math.abs(n[1]) === 1 ? z - z0 : y - y0];
      if (Math.abs(n[2]) === 1) return [x - x0, y - y0];
      if (Math.abs(n[1]) === 1) return [x - x0, z - z0];
      return [z - z0, y - y0];
    });
  };
  face(
    front,
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    [0, 0, 1],
  );
  face(
    back,
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    [0, 0, -1],
  );
  face(
    edge,
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ],
    [1, 0, 0],
  );
  face(
    edge,
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ],
    [-1, 0, 0],
  );
  face(
    edge,
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    [0, 1, 0],
  );
  face(
    edge,
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ],
    [0, -1, 0],
  );
  return [...groups];
};

