import { IAutoMovieSpaceShell, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

/**
 * Volume, in cubic metres, enclosed by a closed outward-wound shell.
 *
 * The divergence theorem over triangles: a sixth of the summed scalar triple
 * products. Voids subtract themselves, because their facets are wound the other
 * way and contribute the negative of what they enclose, which is the whole
 * reason an atrium is inner facets rather than a second record. Exact for the
 * flats as written; what the flats stand for is
 * {@link builtEnvironmentSpaceFidelity}'s answer, not this one's.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtSpaceShellVolume` produces volume, in cubic metres, enclosed by a closed outward-wound shell. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtSpaceShellVolume` performs volume calculation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const builtSpaceShellVolume = (shell: IAutoMovieSpaceShell): number => {
  let sum = 0;
  for (let face = 0; face + 2 < shell.triangles.length; face += 3) {
    const a = shell.vertices[shell.triangles[face]!];
    const b = shell.vertices[shell.triangles[face + 1]!];
    const c = shell.vertices[shell.triangles[face + 2]!];
    if (a === undefined || b === undefined || c === undefined) continue;
    sum +=
      a.x * (b.y * c.z - b.z * c.y) +
      a.y * (b.z * c.x - b.x * c.z) +
      a.z * (b.x * c.y - b.y * c.x);
  }
  return sum / 6;
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
