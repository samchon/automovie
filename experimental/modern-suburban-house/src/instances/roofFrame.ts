import { cross } from "./cross";
import { times } from "./times";
import { minus } from "./minus";
import { Frame } from "./Frame";
import { rotationOf } from "./rotationOf";
import { Vec } from "./Vec";
import { unit } from "./unit";

/** Frame of a roof triangle with `v` pointing up its slope and `u` along its contour. */
export const roofFrame = (triangle: {
  vertices: readonly [Vec, Vec, Vec];
  normal: Vec;
}): Frame => {
  const n = unit(triangle.normal);
  const v = unit(minus([0, 1, 0], times(n, n[1])));
  const u = unit(cross(v, n));
  return {
    origin: triangle.vertices[0],
    u,
    v,
    n,
    rotation: rotationOf(u, v, n),
  };
};
