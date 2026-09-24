/**
 * One watertight partition with a blind, rectangular wall recess. The solid
 * remains connected behind the recess; its near face opens toward +X and the
 * back closes before the opposite room's wall face. Grid cells are emitted
 * only on occupied/empty boundaries, so no internal mating faces survive.
 *
 * Geometry is determined from the wall and recess intervals. The part keeps
 * the full wall's boundary record with no through-hole, since a niche is not
 * a door, route, or opening between spaces.
 */
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type IWallSolid } from "../solids";

export interface IBlindRecess {
  wallX: readonly [number, number];
  wallY: readonly [number, number];
  wallZ: readonly [number, number];
  openingY: readonly [number, number];
  openingZ: readonly [number, number];
  depth: number;
}

const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** Build closed concave wall geometry from metric intervals, with no Boolean mesh subtraction. */
export const blindRecessWall = (input: IBlindRecess): IWallSolid => {
  const [x0, x2] = input.wallX;
  const [y0, y3] = input.wallY;
  const [z0, z3] = input.wallZ;
  const [y1, y2] = input.openingY;
  const [z1, z2] = input.openingZ;
  const x1 = x2 - input.depth;
  if (![x0, x1, x2, y0, y1, y2, y3, z0, z1, z2, z3].every(Number.isFinite))
    throw new Error("blind recess needs finite coordinates");
  if (!(x0 < x1 && x1 < x2 && y0 < y1 && y1 < y2 && y2 < y3 && z0 < z1 && z1 < z2 && z2 < z3))
    throw new Error("blind recess must keep a positive back and a closed margin on every side");

  const xs = [x0, x1, x2];
  const ys = [y0, y1, y2, y3];
  const zs = [z0, z1, z2, z3];
  const occupied = (ix: number, iy: number, iz: number): boolean =>
    ix >= 0 && ix < 2 && iy >= 0 && iy < 3 && iz >= 0 && iz < 3 && !(ix === 1 && iy === 1 && iz === 1);
  const faces: IAutoMovieVector3[][] = [];
  for (let ix = 0; ix < 2; ix++) for (let iy = 0; iy < 3; iy++) for (let iz = 0; iz < 3; iz++) {
    if (!occupied(ix, iy, iz)) continue;
    const [xa, xb] = [xs[ix]!, xs[ix + 1]!];
    const [ya, yb] = [ys[iy]!, ys[iy + 1]!];
    const [za, zb] = [zs[iz]!, zs[iz + 1]!];
    // +X winding is +Y then +Z; -Y winding is +X then +Z;
    // -Z winding is +Y then +X. Reverse those rings for the other sides.
    if (!occupied(ix - 1, iy, iz)) faces.push([point(xa, ya, za), point(xa, ya, zb), point(xa, yb, zb), point(xa, yb, za)]);
    if (!occupied(ix + 1, iy, iz)) faces.push([point(xb, ya, za), point(xb, yb, za), point(xb, yb, zb), point(xb, ya, zb)]);
    if (!occupied(ix, iy - 1, iz)) faces.push([point(xa, ya, za), point(xb, ya, za), point(xb, ya, zb), point(xa, ya, zb)]);
    if (!occupied(ix, iy + 1, iz)) faces.push([point(xa, yb, za), point(xa, yb, zb), point(xb, yb, zb), point(xb, yb, za)]);
    if (!occupied(ix, iy, iz - 1)) faces.push([point(xa, ya, za), point(xa, yb, za), point(xb, yb, za), point(xb, ya, za)]);
    if (!occupied(ix, iy, iz + 1)) faces.push([point(xa, ya, zb), point(xb, ya, zb), point(xb, yb, zb), point(xa, yb, zb)]);
  }
  return {
    mesh: buildAutoMoviePolyhedron(faces),
    face: {
      axis: "z",
      across: input.wallX,
      outline: [{ u: z0, y: y0 }, { u: z3, y: y0 }, { u: z3, y: y3 }, { u: z0, y: y3 }],
      holes: [],
    },
  };
};
