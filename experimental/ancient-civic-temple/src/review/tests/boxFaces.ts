import { v } from "./v";

/** Six outward-wound faces of an axis-aligned box, in engine polyhedron order. */

export const boxFaces = (b: { west: number; east: number; bottom: number; top: number; north: number; south: number; }) => {
  const { west: x0, east: x1, bottom: y0, top: y1, north: z0, south: z1 } = b;
  return [
    [v(x0, y1, z0), v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0)],
    [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1)],
    [v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0), v(x1, y0, z0)],
    [v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1)],
    [v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0)],
    [v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), v(x1, y0, z1)],
  ].map((corners) => ({ surface: "surface.test.box", corners }));
};
