import { Point } from "./structures/Point";
import { millimetrePoint as p } from "./millimetrePoint";

/**
 * Intersect a measured camera ray with a continuous finite Z surface, in mm.
 * Moving along this ray preserves the reference image position while allowing
 * the point to sit on the actual eye surface. The supplied interval must
 * bracket a finite root; bisection handles either direction and endpoint roots.
 */
export const intersectRayWithHeightField = (
  origin: Point,
  direction: Point,
  height: (x: number, y: number) => number,
  interval: [number, number],
): Point => {
  const at = (t: number): Point =>
    p(
      origin.x + direction.x * t,
      origin.y + direction.y * t,
      origin.z + direction.z * t,
    );
  const residual = (t: number): number => {
    const point = at(t);
    return point.z - height(point.x, point.y);
  };
  let [low, high] = interval;
  let left = residual(low);
  const right = residual(high);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left * right > 0)
    throw new Error("A surface intersection needs finite bracketed endpoints.");
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2;
    const value = residual(middle);
    if (left * value <= 0) high = middle;
    else {
      low = middle;
      left = value;
    }
  }
  return at((low + high) / 2);
};
