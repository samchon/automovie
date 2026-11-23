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
 * A celled space is the union of its half-space cells, a shelled space uses its closed boundary, and a space with neither spelling contains nothing. Descendant containment, room visibility, prop occupancy and basin containment share this per-space reader.
 *
 * Boundary points are intended inside. Cell slack is 1e-9 in the plane's scale, measured in metres only for unit normals. Shell surface admission uses a plane-distance check and oriented edge tests with one area-scaled slack, then winding distinguishes the outer region from inward-wound voids. Raw binary64 products and sums can overflow or lose accuracy for extreme or nearly degenerate inputs; the returned Boolean is not an exact containment certificate.
 *
 * @param space Logical space whose stated volume is tested.
 * @param point World point, in metres.
 * @returns True when the point lies inside or on the stated volume.
 */
export const builtSpaceContainsPoint: (
  space: IAutoMovieBuiltSpace,
  point: IAutoMovieVector3,
) => boolean = (
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
 * Sums signed solid angles without choosing a ray direction. For closed consistently wound surfaces in exact arithmetic, inward void contributions cancel the outer winding in the void; this implementation evaluates that sum in binary64 and compares its absolute value with 2π.
 *
 * Tests triangle surfaces before solid angles because angles are singular at vertices and have boundary-dependent limits on faces and edges. Missing indexed vertices and trailing incomplete index triples are skipped; malformed topology is a validation concern.
 */
const spaceShellContainsPoint: (
  shell: IAutoMovieSpaceShell,
  point: IAutoMovieVector3,
) => boolean = (
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
const signedSolidAngle: (
  point: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
) => number = (
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
const pointOnTriangle: (
  point: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
) => boolean = (
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
