import {
  IAutoMovieBuiltSpace,
  IAutoMovieConvexSpaceCell,
  IAutoMovieHalfSpacePlane,
  IAutoMovieSpaceShell,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** A triangle whose doubled area is this small has no usable plane. */
const PLANE_NORMAL_EPSILON: number = 1e-12;

/** Slack, in the plane's own scale, within which a point counts as on it. */
const CONTAINMENT_EPSILON: number = 1e-9;

/**
 * Does one logical space's own stated volume contain a point?
 *
 * The single place either spelling is read, so nothing has to know which one a
 * space used: a celled space is the union of its half-space cells, a shelled
 * space is the inside of its own closed boundary, and a space that states
 * neither locates nothing and contains nothing. Every containment consumer
 * (the descendant-folding {@link builtEnvironmentContainsPoint}, room
 * visibility's per-leaf placement, prop occupancy, a fluid basin's stray-cell
 * walk) goes through here, because a second reading of the same field is how a
 * room and its own camera ended up with two answers about where the camera
 * stood.
 *
 * Points on a cell plane or on the shell surface count as inside. A cell's
 * slack is `1e-9` in the plane's own scale, which is metres only when the
 * normal is unit length; the contract allows unnormalized normals. A shell is
 * read through its winding number, so an inward-facing void excludes the
 * points inside it.
 *
 * @param space Logical space whose stated volume is tested.
 * @param point World point, in metres.
 * @returns True when the point lies inside or on the stated volume.
 *
 * @evidence contracts/common.md#principled-implementation A cell is the intersection of `normal · p <= offset` half-spaces and a celled space their union; a shell is decided by the generalized winding number summed with the Van Oosterom and Strackee solid-angle formula, after a distance test that puts the surface itself inside, because solid angle degenerates on edges and vertices. The premise is a closed, consistently wound shell, which validation enforces.
 * @evidence contracts/common.md#clear-and-simple-design One public reader of both volume spellings with two private helpers for the shell, so every containment consumer shares one answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; the surface-first test is the mathematically required treatment of the solid angle's degenerate set rather than a fix for one measured box.
 * @evidence contracts/common.md#meaningful-documentation States both spellings and the empty case, that the boundary counts as inside, the slack and its unit caveat for unnormalized normals, and how voids read.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the summed plane count of the cells, stopping at the first containing cell, or in the shell's triangle count, stopping at the first triangle the point lies on; no acceleration structure is built because each call answers one point.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure test of one point against one space value that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only temporary vectors and retains nothing.
 * @author Samchon
 */
export const builtSpaceContainsPoint = (
  space: IAutoMovieBuiltSpace,
  point: IAutoMovieVector3,
): boolean => {
  if (space.shell !== undefined)
    return spaceShellContainsPoint(space.shell, point);
  return space.cells.some((cell: IAutoMovieConvexSpaceCell): boolean =>
    cell.planes.every(
      (plane: IAutoMovieHalfSpacePlane): boolean =>
        plane.normal.x * point.x +
          plane.normal.y * point.y +
          plane.normal.z * point.z <=
        plane.offset + CONTAINMENT_EPSILON,
    ),
  );
};

/**
 * Is a point inside a closed shell?
 *
 * The winding number, summed as signed solid angles (Van Oosterom and
 * Strackee), so the answer never depends on a ray direction somebody had to
 * pick and a void's inward facets cancel the outer boundary's contribution
 * exactly. A point strictly inside subtends a full turn, a point outside
 * subtends nothing, and a point in a void subtends nothing because that is
 * what a void is.
 *
 * The shell's own surface is inside it, tested first and by distance, because
 * solid angle degenerates exactly where a crate's corner sits: on a face it is
 * half a turn, but on an edge or at a vertex it is whatever the dihedral
 * happens to be, so a box standing in the corner of a room would have been
 * reported outside the room it is in.
 */
const spaceShellContainsPoint = (
  shell: IAutoMovieSpaceShell,
  point: IAutoMovieVector3,
): boolean => {
  let winding: number = 0;
  for (let face: number = 0; face + 2 < shell.triangles.length; face += 3) {
    const a: IAutoMovieVector3 | undefined =
      shell.vertices[shell.triangles[face]!];
    const b: IAutoMovieVector3 | undefined =
      shell.vertices[shell.triangles[face + 1]!];
    const c: IAutoMovieVector3 | undefined =
      shell.vertices[shell.triangles[face + 2]!];
    if (a === undefined || b === undefined || c === undefined) continue;
    if (pointOnTriangle(point, a, b, c)) return true;
    winding += signedSolidAngle(point, a, b, c);
  }
  return Math.abs(winding) >= 2 * Math.PI;
};

/** Signed solid angle triangle `abc` subtends at `point`, in steradians. */
const signedSolidAngle = (
  point: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): number => {
  const u: IAutoMovieVector3 = Vector3.subtract(a, point);
  const v: IAutoMovieVector3 = Vector3.subtract(b, point);
  const w: IAutoMovieVector3 = Vector3.subtract(c, point);
  const lu: number = Vector3.length(u);
  const lv: number = Vector3.length(v);
  const lw: number = Vector3.length(w);
  const numerator: number = Vector3.dot(u, Vector3.cross(v, w));
  const denominator: number =
    lu * lv * lw +
    Vector3.dot(u, v) * lw +
    Vector3.dot(u, w) * lv +
    Vector3.dot(v, w) * lu;
  return 2 * Math.atan2(numerator, denominator);
};

/** Whether a point sits on triangle `abc`, its edges and corners included. */
const pointOnTriangle = (
  point: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
): boolean => {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const ac: IAutoMovieVector3 = Vector3.subtract(c, a);
  const ap: IAutoMovieVector3 = Vector3.subtract(point, a);
  const normal: IAutoMovieVector3 = Vector3.cross(ab, ac);
  const area: number = Vector3.length(normal);
  if (area <= PLANE_NORMAL_EPSILON) return false;
  const slack: number = CONTAINMENT_EPSILON * area;
  if (Math.abs(Vector3.dot(ap, normal)) > slack) return false;
  const bp: IAutoMovieVector3 = Vector3.subtract(point, b);
  const bc: IAutoMovieVector3 = Vector3.subtract(c, b);
  return (
    Vector3.dot(Vector3.cross(ab, ap), normal) >= -slack &&
    Vector3.dot(Vector3.cross(bc, bp), normal) >= -slack &&
    Vector3.dot(
      Vector3.cross(Vector3.subtract(a, c), Vector3.subtract(point, c)),
      normal,
    ) >= -slack
  );
};
