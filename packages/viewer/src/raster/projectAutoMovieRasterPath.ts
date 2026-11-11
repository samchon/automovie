import type * as THREE from "three";

import type { IAutoMovieRasterFrame } from "./IAutoMovieRasterFrame.js";

/**
 * Clip one triangle or one segment against its material's clipping planes
 * and the camera's near plane, then place what is left in target pixels.
 *
 * Each input vertex is `[wx, wy, wz, cx, cy, cz, cw]`: world metres followed
 * by clip coordinates. Two vertices are a segment; three or more are a convex
 * polygon in order. A clipping plane keeps its positive side, the three.js
 * convention with `clipIntersection` off, so several planes keep the
 * intersection of their positive sides. Each output vertex is
 * `[x, y, depth]`, target pixels from the top-left and normalized device
 * depth; the result is empty when nothing survives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both vertex layouts with units, how the vertex count selects a segment or a polygon, which side a plane keeps and what an empty result means.
 * @evidence contracts/development/implementation.md#principled-implementation Sutherland-Hodgman against one half-space at a time, with world and clip coordinates interpolated together, which is exact because both are affine along a world-space edge; the near plane is cut in clip space before the division, so geometry behind the camera never wraps.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One cutter serves every half-space through a distance callback, and one loop applies the planes, the near plane and the division in that order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A vertex exactly on a plane is kept rather than nudged; a zero clip `w` left after near clipping divides by a tiny positive number instead of producing NaN pixels, which the target's depth range then rejects.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in vertices times half-spaces; an unclipped path allocates one array per half-space and no vertex.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call clips the path it is given; triangles of one mesh share no clipped geometry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates only the returned vertices and the intermediate paths, which die with the call; the frame and planes are read.
 */
export function projectAutoMovieRasterPath(
  frame: IAutoMovieRasterFrame,
  path: number[][],
  planes: readonly THREE.Plane[],
): number[][] {
  const minimum: number = path.length === 2 ? 2 : 3;
  let kept: number[][] = path;

  // World-space section planes first, while world coordinates are exact.
  for (const plane of planes) {
    kept = cut(
      kept,
      (v: number[]): number =>
        plane.normal.x * v[0]! +
        plane.normal.y * v[1]! +
        plane.normal.z * v[2]! +
        plane.constant,
    );
    if (kept.length < minimum) return [];
  }

  // The near plane `z >= -w` in clip space, before the perspective division.
  kept = cut(kept, (v: number[]): number => v[5]! + v[6]!);
  if (kept.length < minimum) return [];

  return kept.map((v: number[]): number[] => {
    const w: number = v[6] === 0 ? 1e-9 : v[6]!;
    return [
      ((v[3]! / w) * 0.5 + 0.5) * frame.target.width,
      (1 - ((v[4]! / w) * 0.5 + 0.5)) * frame.target.height,
      v[5]! / w,
    ];
  });
}

/** Keep the part of a segment or convex polygon where `distance` is not negative. */
function cut(path: number[][], distance: (v: number[]) => number): number[][] {
  const out: number[][] = [];
  const count: number = path.length;

  // A segment has one edge; a polygon closes back onto its first vertex.
  const edges: number = count === 2 ? 1 : count;
  for (let i: number = 0; i < edges; i++) {
    const current: number[] = path[i]!;
    const next: number[] = path[(i + 1) % count]!;
    const dc: number = distance(current);
    const dn: number = distance(next);
    if (dc >= 0) out.push(current);
    if (dc >= 0 !== dn >= 0) {
      const t: number = dc / (dc - dn);
      out.push(
        current.map(
          (value: number, k: number): number => value + (next[k]! - value) * t,
        ),
      );
    }
  }
  if (count === 2 && distance(path[1]!) >= 0) out.push(path[1]!);
  return out;
}
