import { Point } from "./Point";
import { Triangle } from "./Triangle";

/** A ray may leave the building under an eave even when a vertical sky ray is blocked. */

export const rayIntersectsBounds = (origin: Point, direction: Point, triangle: Triangle): boolean => {
  let near = 0, far = Infinity;
  for (const axis of ["x", "y", "z"] as const) {
    const low = triangle[`min${axis.toUpperCase()}` as "minX" | "minY" | "minZ"];
    const high = triangle[`max${axis.toUpperCase()}` as "maxX" | "maxY" | "maxZ"];
    if (Math.abs(direction[axis]) < 1e-12) {
      if (origin[axis] < low - 1e-9 || origin[axis] > high + 1e-9) return false;
      continue;
    }
    let a = (low - origin[axis]) / direction[axis], b = (high - origin[axis]) / direction[axis];
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far + 1e-9) return false;
  }
  return true;
};
