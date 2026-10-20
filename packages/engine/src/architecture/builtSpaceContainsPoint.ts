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
 *
 * @evidence contracts/common.md#principled-implementation Uses half-space intersection/union for cells and the Van Oosterom-Strackee solid-angle sum for shells, with a surface-first triangle test. Closed consistently oriented shells and finite, well-conditioned intermediates are premises; validation checks local opposite edge pairing and positive aggregate volume but does not certify every component's orientation, all self-intersections or arbitrary binary64 containment. Shell plane and edge tests reuse one numeric slack at different geometric scales.
 * @evidence contracts/common.md#clear-and-simple-design One public reader of both volume spellings with two private helpers for the shell, so every containment consumer shares one answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; surface-first handling admits boundary points without selecting a ray direction. Its fixed numeric slack and raw solid-angle arithmetic are stated approximations, not an exact numerical certificate.
 * @evidence contracts/common.md#meaningful-documentation States both spellings and the empty case, that the boundary counts as inside, the slack and its unit caveat for unnormalized normals, and how voids read.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the summed plane count of the cells, stopping at the first containing cell, or in the shell's triangle count, stopping at the first triangle the point lies on; no acceleration structure is built because each call answers one point.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure test of one point against one space value that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only temporary vectors and retains nothing.
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
