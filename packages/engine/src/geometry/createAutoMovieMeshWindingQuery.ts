import type {
  IAutoMovieMesh,
  IAutoMovieMeshWinding,
} from "@automovie/interface";

import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Compile any triangle surface into a query that tells solid from empty space
 * at one point by the generalized winding number.
 *
 * The winding number is the sum of the signed solid angles every triangle
 * subtends at the point, divided by 4 pi (Jacobson, Kavan and Sorkine-Hornung
 * 2013, "Robust Inside-Outside Segmentation using Generalized Winding
 * Numbers"); each triangle's solid angle is the closed form of Van Oosterom and
 * Strackee (1983). Unlike the pseudonormal sign of
 * `createAutoMovieSignedMeshQuery`, it needs no closed, embedded manifold: an
 * open tube, overlapping shells in one index buffer, an edge shared by more
 * than two triangles and a nearly closed surface all read as the share of the
 * view they cover. A point counts as `inside` when it is not on the surface and
 * its absolute winding number is at least 0.5, so an inward-wound shell is
 * solid too and `winding` keeps the sign.
 *
 * Solid angles are singular on the surface, so the same pass first tests
 * whether the point lies on a triangle: within a slack of 1e-9 of that
 * triangle's doubled area from its plane and inside its three edges, edges and
 * corners included, the test `builtSpaceContainsPoint` has always used. A
 * triangle whose doubled area is at most 1e-12 m2 has no plane to test: it
 * holds no surface point and contributes nothing to the sum, which is its exact
 * solid angle when its area is zero; the closed form would instead give plus or
 * minus 2 pi at a point on its line.
 *
 * The mesh is snapshotted, so changing it later needs a new query. Coordinates
 * are metres in the mesh's frame. Admission throws on a malformed index buffer,
 * a non-finite position and a mesh without triangles. A query throws on a point
 * that is not three finite coordinates.
 *
 * @param mesh Surface to snapshot; only read.
 * @returns The query for one XYZ point in metres.
 */
export const createAutoMovieMeshWindingQuery: (
  mesh: IAutoMovieMesh,
) => (point: readonly number[]) => IAutoMovieMeshWinding = (
  mesh: IAutoMovieMesh,
): ((point: readonly number[]) => IAutoMovieMeshWinding) => {
  const indices: number[] = triangleIndicesOf(mesh, "Mesh winding queries");
  if (indices.length === 0)
    throw new Error("Mesh winding queries need at least one triangle.");
  if (!mesh.positions.every(Number.isFinite))
    throw new Error("Mesh winding queries need finite positions.");

  // Snapshot each position once. A kept triangle uses three XYZ offsets and
  // its unnormalized normal. Allocate directly in the snapshot storage.
  const p: Float64Array = Float64Array.from(mesh.positions);
  const corners: Uint32Array = new Uint32Array(indices.length);
  const normals: Float64Array = new Float64Array(indices.length);
  let size: number = 0;
  for (let at: number = 0; at < indices.length; at += 3) {
    const a: number = indices[at]! * 3;
    const b: number = indices[at + 1]! * 3;
    const c: number = indices[at + 2]! * 3;
    const abx: number = p[b]! - p[a]!;
    const aby: number = p[b + 1]! - p[a + 1]!;
    const abz: number = p[b + 2]! - p[a + 2]!;
    const acx: number = p[c]! - p[a]!;
    const acy: number = p[c + 1]! - p[a + 1]!;
    const acz: number = p[c + 2]! - p[a + 2]!;
    const nx: number = aby * acz - abz * acy;
    const ny: number = abz * acx - abx * acz;
    const nz: number = abx * acy - aby * acx;
    if (Math.hypot(nx, ny, nz) <= PLANE_NORMAL_EPSILON) continue;
    corners[size] = a;
    corners[size + 1] = b;
    corners[size + 2] = c;
    normals[size] = nx;
    normals[size + 1] = ny;
    normals[size + 2] = nz;
    size += 3;
  }

  return (point: readonly number[]): IAutoMovieMeshWinding => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Mesh winding queries require finite XYZ coordinates.");
    const px: number = point[0]!;
    const py: number = point[1]!;
    const pz: number = point[2]!;
    let surface: boolean = false;
    let angles: number = 0;
    for (let at: number = 0; at < size; at += 3) {
      const a: number = corners[at]!;
      const b: number = corners[at + 1]!;
      const c: number = corners[at + 2]!;
      const ux: number = p[a]! - px;
      const uy: number = p[a + 1]! - py;
      const uz: number = p[a + 2]! - pz;
      const vx: number = p[b]! - px;
      const vy: number = p[b + 1]! - py;
      const vz: number = p[b + 2]! - pz;
      const wx: number = p[c]! - px;
      const wy: number = p[c + 1]! - py;
      const wz: number = p[c + 2]! - pz;
      if (
        !surface &&
        onTriangle(
          ux,
          uy,
          uz,
          vx,
          vy,
          vz,
          wx,
          wy,
          wz,
          normals[at]!,
          normals[at + 1]!,
          normals[at + 2]!,
        )
      )
        surface = true;

      // Van Oosterom and Strackee: tan(omega / 2) = [u v w] / (|u||v||w| +
      // (u.v)|w| + (u.w)|v| + (v.w)|u|), with u, v, w the corners seen from
      // the point; atan2 keeps the half-angle's quadrant.
      const lu: number = Math.sqrt(ux * ux + uy * uy + uz * uz);
      const lv: number = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const lw: number = Math.sqrt(wx * wx + wy * wy + wz * wz);
      const triple: number =
        ux * (vy * wz - vz * wy) +
        uy * (vz * wx - vx * wz) +
        uz * (vx * wy - vy * wx);
      const denominator: number =
        lu * lv * lw +
        (ux * vx + uy * vy + uz * vz) * lw +
        (ux * wx + uy * wy + uz * wz) * lv +
        (vx * wx + vy * wy + vz * wz) * lu;
      angles += 2 * Math.atan2(triple, denominator);
    }
    const winding: number = angles / (4 * Math.PI);
    return {
      winding,
      surface,
      inside: !surface && Math.abs(winding) >= 0.5,
    };
  };
};

/**
 * A triangle whose doubled area, in square metres, is this small has no usable
 * plane.
 */
const PLANE_NORMAL_EPSILON: number = 1e-12;

/**
 * Slack, as a share of the triangle's doubled area, within which a point counts
 * as on it.
 */
const SURFACE_EPSILON: number = 1e-9;

/**
 * Whether the point lies on the triangle whose corners, seen from the point,
 * are `u`, `v` and `w`, edges and corners included.
 *
 * The plane test bounds the point's offset times the doubled area, and each
 * edge test the signed doubled area of the point and that edge times the
 * triangle's doubled area, all by one slack of `SURFACE_EPSILON` times the
 * doubled area, the test `builtSpaceContainsPoint` has always applied.
 */
const onTriangle: (
  ux: number,
  uy: number,
  uz: number,
  vx: number,
  vy: number,
  vz: number,
  wx: number,
  wy: number,
  wz: number,
  nx: number,
  ny: number,
  nz: number,
) => boolean = (
  ux: number,
  uy: number,
  uz: number,
  vx: number,
  vy: number,
  vz: number,
  wx: number,
  wy: number,
  wz: number,
  nx: number,
  ny: number,
  nz: number,
): boolean => {
  const area: number = Math.sqrt(nx * nx + ny * ny + nz * nz);
  const slack: number = SURFACE_EPSILON * area;

  // The point minus corner a is -u, so its offset along the normal is -u.n.
  if (Math.abs(ux * nx + uy * ny + uz * nz) > slack) return false;
  return (
    edgeSide(ux, uy, uz, vx, vy, vz, nx, ny, nz) >= -slack &&
    edgeSide(vx, vy, vz, wx, wy, wz, nx, ny, nz) >= -slack &&
    edgeSide(wx, wy, wz, ux, uy, uz, nx, ny, nz) >= -slack
  );
};

/**
 * The side of the point on the directed edge from corner `s` to corner `e`,
 * both seen from the point: ((e - s) x (p - s)) . n, which is (e - s) x (-s)
 * dotted with the normal, positive inside a counter-clockwise triangle.
 */
const edgeSide: (
  sx: number,
  sy: number,
  sz: number,
  ex: number,
  ey: number,
  ez: number,
  nx: number,
  ny: number,
  nz: number,
) => number = (
  sx: number,
  sy: number,
  sz: number,
  ex: number,
  ey: number,
  ez: number,
  nx: number,
  ny: number,
  nz: number,
): number => {
  const dx: number = ex - sx;
  const dy: number = ey - sy;
  const dz: number = ez - sz;
  return (
    (dy * -sz - dz * -sy) * nx +
    (dz * -sx - dx * -sz) * ny +
    (dx * -sy - dy * -sx) * nz
  );
};
