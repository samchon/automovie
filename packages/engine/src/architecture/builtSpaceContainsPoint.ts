import {
  IAutoMovieBuiltSpace,
  IAutoMovieSpaceShell,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

const PLANE_NORMAL_EPSILON = 1e-12;

const CONTAINMENT_EPSILON = 1e-9;

/**
 * Does one logical space's own stated volume contain a point?
 *
 * The single place either spelling is read, so nothing has to know which one a
 * space used: a celled space is the union of its half-space cells, a shelled
 * space is the inside of its own closed boundary, and a space that states
 * neither locates nothing and contains nothing. Every containment consumer —
 * the descendant-folding {@link builtEnvironmentContainsPoint}, room
 * visibility's per-leaf placement, prop occupancy, a fluid basin's stray-cell
 * walk — goes through here, because a second reading of the same field is how a
 * room and its own camera ended up with two answers about where the camera
 * stood.
 *
 * Points on a cell plane or on the shell surface count as inside. A cell's
 * slack is `1e-9` in the plane's own scale, which is metres only when the
 * normal is unit length; the contract allows unnormalized normals.
 *
 * @evidence contracts/common.md#principled-implementation A celled space contains a point when some cell admits it on every plane within `CONTAINMENT_EPSILON`, and a shelled space uses the Van Oosterom-Strackee winding number after an on-surface test, so voids cancel and no ray direction is chosen; the cell slack scales with each unnormalized normal's length.
 * @evidence contracts/common.md#clear-and-simple-design One exported reader for both volume spellings, with private solid-angle and on-triangle helpers, so no consumer branches on cells versus shell.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The surface-first test is a stated compensation for the solid angle's degeneracy at edges and vertices, and a triangle naming a missing vertex is skipped, which only a shell validation never saw can carry.
 * @evidence contracts/common.md#meaningful-documentation States the two spellings and the empty case, the single-reader rule with its consumers, that boundary points are inside, the scale of the cell slack, and on the helper the winding-number method and why the surface is tested first.
 * @evidence contracts/performance.md#cost-and-resources Linear in cell planes for a celled space and in triangles for a shell, one `atan2` and one on-triangle test per triangle; there is no spatial index or per-shell cache, so every point against a dense shell pays every triangle.
 * @author Samchon
 */
export const builtSpaceContainsPoint = (
  space: IAutoMovieBuiltSpace,
  point: IAutoMovieVector3,
): boolean => {
  if (space.shell !== undefined)
    return spaceShellContainsPoint(space.shell, point);
  return space.cells.some((cell) =>
    cell.planes.every(
      (plane) =>
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
 * The winding number, summed as signed solid angles (Van Oosterom–Strackee), so
 * the answer never depends on a ray direction somebody had to pick and a void's
 * inward facets cancel the outer boundary's contribution exactly. A point
 * strictly inside subtends a full turn, a point outside subtends nothing, and a
 * point in a void subtends nothing because that is what a void is.
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
  let winding = 0;
  for (let face = 0; face + 2 < shell.triangles.length; face += 3) {
    const a = shell.vertices[shell.triangles[face]!];
    const b = shell.vertices[shell.triangles[face + 1]!];
    const c = shell.vertices[shell.triangles[face + 2]!];
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
  const u = Vector3.subtract(a, point);
  const v = Vector3.subtract(b, point);
  const w = Vector3.subtract(c, point);
  const lu = Vector3.length(u);
  const lv = Vector3.length(v);
  const lw = Vector3.length(w);
  const numerator = Vector3.dot(u, Vector3.cross(v, w));
  const denominator =
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
  const ab = Vector3.subtract(b, a);
  const ac = Vector3.subtract(c, a);
  const ap = Vector3.subtract(point, a);
  const normal = Vector3.cross(ab, ac);
  const area = Vector3.length(normal);
  if (area <= PLANE_NORMAL_EPSILON) return false;
  if (Math.abs(Vector3.dot(ap, normal)) > CONTAINMENT_EPSILON * area)
    return false;
  const bp = Vector3.subtract(point, b);
  const bc = Vector3.subtract(c, b);
  const slack = CONTAINMENT_EPSILON * area;
  return (
    Vector3.dot(Vector3.cross(ab, ap), normal) >= -slack &&
    Vector3.dot(Vector3.cross(bc, bp), normal) >= -slack &&
    Vector3.dot(
      Vector3.cross(Vector3.subtract(a, c), Vector3.subtract(point, c)),
      normal,
    ) >= -slack
  );
};
