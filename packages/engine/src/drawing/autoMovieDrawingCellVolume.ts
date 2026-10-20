import {
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/** Distance in metres within which a corner counts as on or inside a plane. */
const ON_PLANE_TOLERANCE: number = 1e-6;

/** Determinant below which three plane normals do not meet in one corner. */
const SINGULAR_DETERMINANT: number = 1e-9;

/** A half-space restated with a unit normal, so its offset is a distance. */
interface IUnitPlane {
  normal: IAutoMovieVector3;
  offset: number;
}

/**
 * Volume of one bounded convex cell in cubic metres, from its own half-spaces,
 * or `null` when the cell is unbounded or degenerate.
 *
 * Every triple of planes is solved for its corner, corners outside any other
 * half-space are discarded, and the survivors are the cell's vertices. Each
 * face is then the hull of the vertices lying on one plane, and the volume is
 * the sum of the cones from the vertices' mean, an interior point of the
 * convex cell, to those faces.
 *
 * `null` covers fewer than four vertices and a face set whose area-weighted
 * normals do not cancel, which is how a cell open on one side is caught even
 * when it has enough corners: a column bounded on four sides and open at the
 * top would otherwise report zero, and a wedge with two capping planes would
 * report a wrong number. Planes repeated exactly or as a scaled copy are
 * counted once, so a repeated half-space adds no second cone.
 *
 * @param planes The cell's half-spaces `normal . p <= offset`; normals must be
 *   non-zero, which validation enforces, and need not be unit length.
 * @returns The cell's volume in cubic metres, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Vertex enumeration by solving every plane triple with Cramer's rule, a hull per supporting plane, and the cone decomposition `sum(area * height) / 3` about an interior point, which is exact for a convex polyhedron; the closed-surface test uses the divergence-theorem identity that a closed surface's vector area is zero, and the limitation is that vertices and planes are welded on fixed tolerances, so a cell thinner than a micrometre measures as degenerate.
 * @evidence contracts/common.md#clear-and-simple-design One function owns normalization, deduplication, vertex enumeration, face hulls and the closure test; the plane solve and the face basis are private helpers because no other caller needs them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cell shape is special-cased; an unbounded or degenerate cell returns `null` for the caller to report as a gap rather than a placeholder volume, and duplicate planes are merged because they bound nothing new, not to fix a particular input.
 * @evidence contracts/common.md#meaningful-documentation The comment states the half-space convention, the algorithm, what `null` covers and how the open-cell case is detected, the duplicate-plane rule, the normal premise and the units.
 * @evidence contracts/performance.md#efficient-algorithms For `p` distinct planes, enumeration solves `p^3 / 6` triples and checks each corner against every plane, so time is `O(p^4)`, followed by one hull per plane over the `v` vertices; this suits authored cells of a handful of planes, where a half-space intersection algorithm with better asymptotics would add a dual-hull construction for no measurable gain.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one cell's planes, called once per cell per quantity report, so no equivalent work repeats inside it or across its callers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the plane, vertex and key collections for one call and returns a number; nothing outlives the call.
 */
export const autoMovieDrawingCellVolume = (
  planes: readonly IAutoMovieHalfSpacePlane[],
): number | null => {
  // Normalized so a plane's offset is a true distance, and deduplicated
  // because a repeated half-space would stand a second cone on a face that
  // exists once and inflate the solid by that whole face.
  const unique: Map<string, IUnitPlane> = new Map();
  for (const plane of planes) {
    const unit: IUnitPlane = {
      normal: Vector3.normalize(plane.normal),
      offset: plane.offset / Vector3.length(plane.normal),
    };
    unique.set(
      [unit.normal.x, unit.normal.y, unit.normal.z, unit.offset]
        .map(roundAutoMovieDrawingScalar)
        .join(","),
      unit,
    );
  }
  const scaled: IUnitPlane[] = [...unique.values()];
  const vertices: IAutoMovieVector3[] = [];
  const seen: Set<string> = new Set();
  for (let i: number = 0; i < scaled.length; ++i)
    for (let j: number = i + 1; j < scaled.length; ++j)
      for (let k: number = j + 1; k < scaled.length; ++k) {
        const corner: IAutoMovieVector3 | null = intersectPlanes(
          scaled[i]!,
          scaled[j]!,
          scaled[k]!,
        );
        if (corner === null) continue;
        if (
          scaled.some(
            (plane: IUnitPlane): boolean =>
              Vector3.dot(plane.normal, corner) - plane.offset >
              ON_PLANE_TOLERANCE,
          )
        )
          continue;
        const id: string = `${roundAutoMovieDrawingScalar(corner.x)},${roundAutoMovieDrawingScalar(corner.y)},${roundAutoMovieDrawingScalar(corner.z)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        vertices.push(corner);
      }
  if (vertices.length < 4) return null;
  const center: IAutoMovieVector3 = Vector3.scale(
    vertices.reduce(
      (sum: IAutoMovieVector3, vertex: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(sum, vertex),
      Vector3.create(),
    ),
    1 / vertices.length,
  );
  let volume: number = 0;
  // The vector area of a closed surface is zero. An unbounded cell has faces
  // where it was cut and none where it runs off, so its vector area cannot
  // cancel, which catches the open cells a vertex count cannot.
  let closure: IAutoMovieVector3 = Vector3.create();
  let facing: number = 0;
  for (const plane of scaled) {
    const basis: { right: IAutoMovieVector3; up: IAutoMovieVector3 } =
      faceBasis(plane.normal);
    const flattened: IAutoMovieVector3[] = vertices
      .filter(
        (vertex: IAutoMovieVector3): boolean =>
          Math.abs(Vector3.dot(plane.normal, vertex) - plane.offset) <=
          ON_PLANE_TOLERANCE,
      )
      .map(
        (vertex: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: Vector3.dot(vertex, basis.right),
          y: 0,
          z: Vector3.dot(vertex, basis.up),
        }),
      );
    // A redundant plane touching the solid at one vertex or along one edge
    // bounds no face, and neither does a plane whose vertices are collinear;
    // the hull collapses in both cases and the cone contributes nothing.
    const hull: IAutoMovieVector3[] = convexHull2D(flattened);
    if (hull.length < 3) continue;
    let doubled: number = 0;
    for (let index: number = 0; index < hull.length; ++index) {
      const current: IAutoMovieVector3 = hull[index]!;
      const next: IAutoMovieVector3 = hull[(index + 1) % hull.length]!;
      doubled += current.x * next.z - next.x * current.z;
    }
    const area: number = Math.abs(doubled) / 2;
    const height: number = Math.abs(
      Vector3.dot(plane.normal, center) - plane.offset,
    );
    volume += (area * height) / 3;
    closure = Vector3.add(closure, Vector3.scale(plane.normal, area));
    facing += area;
  }
  if (Vector3.length(closure) > facing * ON_PLANE_TOLERANCE) return null;
  return volume;
};

/** Two unit axes spanning the plane whose unit normal is given. */
const faceBasis = (
  normal: IAutoMovieVector3,
): { right: IAutoMovieVector3; up: IAutoMovieVector3 } => {
  const seed: IAutoMovieVector3 =
    Math.abs(normal.x) < 0.9
      ? Vector3.create(1, 0, 0)
      : Vector3.create(0, 1, 0);
  const right: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(seed, normal),
  );
  return { right, up: Vector3.cross(normal, right) };
};

/** The one point three planes share, or `null` when two are parallel. */
const intersectPlanes = (
  first: IUnitPlane,
  second: IUnitPlane,
  third: IUnitPlane,
): IAutoMovieVector3 | null => {
  const cross23: IAutoMovieVector3 = Vector3.cross(second.normal, third.normal);
  const determinant: number = Vector3.dot(first.normal, cross23);
  if (Math.abs(determinant) <= SINGULAR_DETERMINANT) return null;
  const cross31: IAutoMovieVector3 = Vector3.cross(third.normal, first.normal);
  const cross12: IAutoMovieVector3 = Vector3.cross(first.normal, second.normal);
  return Vector3.scale(
    Vector3.add(
      Vector3.add(
        Vector3.scale(cross23, first.offset),
        Vector3.scale(cross31, second.offset),
      ),
      Vector3.scale(cross12, third.offset),
    ),
    1 / determinant,
  );
};
