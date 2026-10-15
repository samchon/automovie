import type { IAutoMovieVector3 } from "@automovie/interface";

/** Area of a convex planar polygon in 3D, m². */

export const faceArea = (corners: readonly IAutoMovieVector3[]): number => {
  let x = 0, y = 0, z = 0;
  for (let i = 1; i + 1 < corners.length; ++i) {
    const a = corners[0]!, b = corners[i]!, c = corners[i + 1]!;
    const u = [b.x - a.x, b.y - a.y, b.z - a.z], w = [c.x - a.x, c.y - a.y, c.z - a.z];
    x += u[1]! * w[2]! - u[2]! * w[1]!;
    y += u[2]! * w[0]! - u[0]! * w[2]!;
    z += u[0]! * w[1]! - u[1]! * w[0]!;
  }
  return Math.hypot(x, y, z) / 2;
};
