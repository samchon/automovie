import { Plane } from "./Plane";
import { Point } from "./Point";

/** Clip a convex polygon by one half-plane, for nonempty-strip selection. */

export const clip = (polygon: readonly Point[], plane: Plane): Point[] => {
  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!, b = polygon[(i + 1) % polygon.length]!;
    const fa = plane.x * a[0] + plane.y * a[1] - plane.limit;
    const fb = plane.x * b[0] + plane.y * b[1] - plane.limit;
    if (fa <= 1e-9) output.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
      const t = fa / (fa - fb);
      output.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return output;
};
