import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMovieMesh } from "@automovie/interface";
import { block } from "./block";
import { cross } from "./cross";
import { sub } from "./sub";

/**
 * A straight bar of square section between two world points, for rails and
 * sloped handrails. Its four long faces follow the bar direction; the section
 * is `size` wide and stays level across the bar.
 */


export const bar = (from: IAutoMovieVector3, to: IAutoMovieVector3, size: number): IAutoMovieMesh => {
  const dir = sub(to, from);
  const horizontal = Math.hypot(dir.x, dir.z);
  if (horizontal === 0) return block(
    [from.x - size / 2, Math.min(from.y, to.y), from.z - size / 2],
    [from.x + size / 2, Math.max(from.y, to.y), from.z + size / 2]
  );
  const side = {
    x: (-dir.z / horizontal) * (size / 2),
    y: 0,
    z: (dir.x / horizontal) * (size / 2),
  };
  const lift = { x: 0, y: size / 2, z: 0 };
  const corner = (p: IAutoMovieVector3, s: number, l: number): IAutoMovieVector3 => ({
    x: p.x + side.x * s + lift.x * l,
    y: p.y + side.y * s + lift.y * l,
    z: p.z + side.z * s + lift.z * l,
  });
  const a = [
    corner(from, -1, -1),
    corner(from, 1, -1),
    corner(from, 1, 1),
    corner(from, -1, 1),
  ];
  const b = [
    corner(to, -1, -1),
    corner(to, 1, -1),
    corner(to, 1, 1),
    corner(to, -1, 1),
  ];
  const faces: IAutoMovieVector3[][] = [
    [a[0]!, a[3]!, a[2]!, a[1]!],
    [b[0]!, b[1]!, b[2]!, b[3]!],
  ];
  for (let i = 0; i < 4; ++i) {
    const j = (i + 1) % 4;
    faces.push([a[i]!, a[j]!, b[j]!, b[i]!]);
  }
  // Keep every face outward: a face whose normal points toward the bar axis is reversed.
  const mid = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
    z: (from.z + to.z) / 2,
  };
  return buildAutoMoviePolyhedron(
    faces.map((f) => {
      const n = cross(sub(f[1]!, f[0]!), sub(f[2]!, f[0]!));
      const c = f.reduce(
        (s, p) => ({
          x: s.x + p.x / f.length,
          y: s.y + p.y / f.length,
          z: s.z + p.z / f.length,
        }),
        { x: 0, y: 0, z: 0 }
      );
      const out = sub(c, mid);
      return n.x * out.x + n.y * out.y + n.z * out.z >= 0 ? f : [...f].reverse();
    })
  );
};
