import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMovieMesh } from "@automovie/interface";
import type { IPlanPoint } from "../types/IPlanPoint";
import { cross } from "./cross";
import { sub } from "./sub";



/**
 * Closed slab mesh over a plan polygon under a sloped top, with a constant thickness or an explicit
 * underside. Throws for fewer than three corners or no thickness.
 */
export const slopedSlab = (props: {
  plan: readonly IPlanPoint[];
  top: (x: number, z: number) => number;
  /** Constant vertical thickness under the top; ignored when `floor` is given. */
  thickness?: number;
  /** An underside instead: a level (a beam packer) or a planar height function (a wall-head wedge). */
  floor?: number | ((x: number, z: number) => number);
  /** Free outline edges alone receive visible vertical thickness. */
  freeEdge?: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean;
}): IAutoMovieMesh => {
  if (props.plan.length < 3) throw new Error(
    "sloped slab needs at least three plan corners"
  );
  if (props.floor === undefined && !(props.thickness! > 0)) throw new Error(
    "sloped slab needs a positive thickness or a floor"
  );
  const up = props.plan.map((p) => ({
    x: p.x,
    y: props.top(p.x, p.z),
    z: p.z,
  }));
  const normal = cross(sub(up[1]!, up[0]!), sub(up[2]!, up[0]!));
  const top = normal.y > 0 ? up : [...up].reverse();
  const floor = props.floor;
  const bottom = top.map((p) => ({
    x: p.x,
    y: floor === undefined
      ? p.y - props.thickness!
      : typeof floor === "number"
        ? floor
        : floor(p.x, p.z),
    z: p.z,
  }));
  const faces: IAutoMovieVector3[][] = [top, [...bottom].reverse()];
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean => Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9 && Math.abs(a.z - b.z) < 1e-9;
  for (let i = 0; i < top.length; ++i) {
    const j = (i + 1) % top.length;
    if (props.freeEdge !== undefined && !props.freeEdge(top[i]!, top[j]!)) continue;
    // A wedge meets its floor along an edge: drop the coincident corners so the
    // side under that edge is a triangle, and skip a side with no height at all.
    const side = [top[i]!, bottom[i]!, bottom[j]!, top[j]!].filter(
      (p, k, all) => !same(p, all[(k + all.length - 1) % all.length]!)
    );
    if (side.length >= 3) faces.push(side);
  }
  return buildAutoMoviePolyhedron(faces);
};
