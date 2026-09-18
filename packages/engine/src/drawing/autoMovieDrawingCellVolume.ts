import { IAutoMovieDrawingPoint, IAutoMovieHalfSpacePlane, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * Volume of one bounded convex cell, from its own half-spaces.
 *
 * Every triple of planes is solved for its corner, corners outside any other
 * half-space are discarded, and the survivors are the cell's vertices. Each
 * face is then the hull of the vertices lying on one plane, and the volume is
 * the sum of the cones from the cell's interior point to those faces. An
 * unbounded or degenerate cell has no such vertex set and reports `null` rather
 * than a number nobody can act on.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Measures a logical cell from the same half-spaces that define its drawing regions and returns no false number for an open cell.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Normalizes and deduplicates planes, solves their bounded vertices, verifies face closure, and sums interior-point cones or returns `null`.
 */
export const autoMovieDrawingCellVolume = (
  planes: readonly IAutoMovieHalfSpacePlane[],
): number | null => {
  // Normalized so a plane's offset is a true distance: the design deliberately
  // does not require a unit normal, and a cone height taken against an
  // unnormalized one would scale the volume by whatever length the author wrote.
  //
  // Deduplicated for a sharper reason. The volume below is the sum of the cones
  // standing on the solid's faces, so a plane written twice — or written once
  // long and once short — would stand a second cone on a face that exists once
  // and inflate the solid by that whole face. A repeated half-space bounds
  // nothing new, and it must measure nothing new.
  const scaled = [
    ...new Map(
      planes.map((plane) => {
        const normal = Vector3.normalize(plane.normal);
        const offset = plane.offset / Vector3.length(plane.normal);
        return [
          [normal.x, normal.y, normal.z, offset]
            .map(roundAutoMovieDrawingScalar)
            .join(","),
          { normal, offset },
        ] as const;
      }),
    ).values(),
  ];
  const vertices: IAutoMovieVector3[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < scaled.length; ++i)
    for (let j = i + 1; j < scaled.length; ++j)
      for (let k = j + 1; k < scaled.length; ++k) {
        const corner = intersectPlanes(scaled[i]!, scaled[j]!, scaled[k]!);
        if (corner === null) continue;
        if (
          scaled.some(
            (plane) => Vector3.dot(plane.normal, corner) - plane.offset > 1e-6,
          )
        )
          continue;
        const id = `${roundAutoMovieDrawingScalar(corner.x)},${roundAutoMovieDrawingScalar(corner.y)},${roundAutoMovieDrawingScalar(corner.z)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        vertices.push(corner);
      }
  if (vertices.length < 4) return null;
  const interior = vertices.reduce(
    (sum, vertex) => Vector3.add(sum, vertex),
    Vector3.create(),
  );
  const center = Vector3.scale(interior, 1 / vertices.length);
  let volume = 0;
  // The vector area of a closed surface is zero: every face's outward normal is
  // cancelled by the rest of the boundary. An unbounded cell has faces where it
  // was cut and none where it runs off, so its vector area cannot cancel — and
  // that is the only cheap way to catch the unbounded cells a vertex count
  // cannot. A column bounded on four sides and open at the top has four corners
  // and would otherwise report a confident zero; a wedge with two capping
  // planes has six and would report a confident wrong number.
  let closure = Vector3.create();
  let facing = 0;
  for (const plane of scaled) {
    const onFace = vertices.filter(
      (vertex) =>
        Math.abs(Vector3.dot(plane.normal, vertex) - plane.offset) <= 1e-6,
    );
    const basis = faceBasis(plane.normal);
    const flattened = onFace.map((vertex) => ({
      x: Vector3.dot(vertex, basis.right),
      y: 0,
      z: Vector3.dot(vertex, basis.up),
    }));
    // A redundant plane touching the solid at one vertex or along one edge
    // bounds no face, and neither does a plane whose vertices are collinear;
    // the hull collapses in both cases and the cone contributes nothing.
    const hull = convexHull2D(flattened);
    if (hull.length < 3) continue;
    let doubled = 0;
    for (let index = 0; index < hull.length; ++index) {
      const current = hull[index]!;
      const next = hull[(index + 1) % hull.length]!;
      doubled += current.x * next.z - next.x * current.z;
    }
    const area = Math.abs(doubled) / 2;
    const height = Math.abs(Vector3.dot(plane.normal, center) - plane.offset);
    volume += (area * height) / 3;
    closure = Vector3.add(closure, Vector3.scale(plane.normal, area));
    facing += area;
  }
  if (Vector3.length(closure) > facing * 1e-6) return null;
  return volume;
};

const faceBasis = (
  normal: IAutoMovieVector3,
): { right: IAutoMovieVector3; up: IAutoMovieVector3 } => {
  const seed =
    Math.abs(normal.x) < 0.9
      ? Vector3.create(1, 0, 0)
      : Vector3.create(0, 1, 0);
  const right = Vector3.normalize(Vector3.cross(seed, normal));
  return { right, up: Vector3.cross(normal, right) };
};

const intersectPlanes = (
  first: { normal: IAutoMovieVector3; offset: number },
  second: { normal: IAutoMovieVector3; offset: number },
  third: { normal: IAutoMovieVector3; offset: number },
): IAutoMovieVector3 | null => {
  const cross23 = Vector3.cross(second.normal, third.normal);
  const determinant = Vector3.dot(first.normal, cross23);
  if (Math.abs(determinant) <= 1e-9) return null;
  const cross31 = Vector3.cross(third.normal, first.normal);
  const cross12 = Vector3.cross(first.normal, second.normal);
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

const clipHalfPlane = (
  polygon: readonly IAutoMovieDrawingPoint[],
  a: number,
  b: number,
  c: number,
): IAutoMovieDrawingPoint[] => {
  const out: IAutoMovieDrawingPoint[] = [];
  for (let index = 0; index < polygon.length; ++index) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    const dCurrent = a * current.x + b * current.y - c;
    const dNext = a * next.x + b * next.y - c;
    if (dCurrent <= 0) out.push(current);
    if (dCurrent * dNext < 0) {
      const t = dCurrent / (dCurrent - dNext);
      out.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }
  return out;
};

const requireFiniteVector = (value: IAutoMovieVector3, label: string): void => {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new Error(`${label} must be finite on every axis`);
};

const requireOptionalDepth = (value: number | null, label: string): void => {
  if (value !== null && (!Number.isFinite(value) || value < 0))
    throw new Error(
      `${label} must be null or a finite number at or above zero, but was ${value}`,
    );
};

const faceBasis = (
  normal: IAutoMovieVector3,
): { right: IAutoMovieVector3; up: IAutoMovieVector3 } => {
  const seed =
    Math.abs(normal.x) < 0.9
      ? Vector3.create(1, 0, 0)
      : Vector3.create(0, 1, 0);
  const right = Vector3.normalize(Vector3.cross(seed, normal));
  return { right, up: Vector3.cross(normal, right) };
};

const intersectPlanes = (
  first: { normal: IAutoMovieVector3; offset: number },
  second: { normal: IAutoMovieVector3; offset: number },
  third: { normal: IAutoMovieVector3; offset: number },
): IAutoMovieVector3 | null => {
  const cross23 = Vector3.cross(second.normal, third.normal);
  const determinant = Vector3.dot(first.normal, cross23);
  if (Math.abs(determinant) <= 1e-9) return null;
  const cross31 = Vector3.cross(third.normal, first.normal);
  const cross12 = Vector3.cross(first.normal, second.normal);
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
