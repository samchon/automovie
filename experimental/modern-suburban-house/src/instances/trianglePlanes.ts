import { Plane } from "./Plane";
import { Point } from "./Point";


/** The three half-planes whose intersection is the triangle, whatever its winding. */
export const trianglePlanes = (
  vertices: readonly [Point, Point, Point]
): Plane[] => {
  const [a, b, c] = vertices;
  const sign = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0 ? 1 : -1;
  return vertices.map((p, i) => {
    const q = vertices[(i + 1) % 3]!;
    const dx = q[0] - p[0], dy = q[1] - p[1];
    return {
      x: sign * dy,
      y: -sign * dx,
      limit: sign * (dy * p[0] - dx * p[1]),
    };
  });
};
