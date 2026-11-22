import {
  pointInPolygon,
  polygonInside,
  triangulateAutoMovieRegion,
} from "@automovie/engine";
import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionTriangulation,
} from "@automovie/interface";

/**
 * Keep walking support inside the inner faces of the plan's walls.
 *
 * The slab geometry remains unchanged. Its already planned flight apertures
 * keep their exact shapes, while every original wall ring moves inward into
 * the room by half the wall thickness.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical winding, metre clearance, retained slab holes and refusal of collapsed or self-intersecting rooms.
 * @evidence contracts/development/implementation.md#principled-implementation Intersects the parallel offsets of adjacent edges along the unit inward normals. Refuses reversed edges and flipped inset topology before applying the shared region gate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Separates useful floor support from renderable slabs and the named aperture that bridges the physical partition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A setback that ceases to give one simple usable plan refuses instead of leaving support under a wall. Mitered corners conservatively leave additional clearance at beveled wall joints.
 * @evidence contracts/development/implementation.md#efficient-algorithms Offset work is linear in walked ring vertices before containment and the shared triangulation, whose complete cost depends on plan size and hole count.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admitted room support is prepared once with the building plan, before placement.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned room owns its offset rings and one anchor. Temporary triangulation and candidate points are released on return.
 */
export function buildingWalkable(
  walls: readonly IAutoMovieProfilePoint[][],
  slab: readonly IAutoMovieProfilePoint[][],
  anchor: IAutoMovieProfilePoint,
  setback: number,
  path: string,
): { rings: IAutoMovieProfilePoint[][]; anchor: IAutoMovieProfilePoint } {
  const physical: IAutoMovieProfilePoint[][] = walls.map(
    (ring: IAutoMovieProfilePoint[]): IAutoMovieProfilePoint[] =>
      insetRing(ring, setback, path),
  );
  const outer: IAutoMovieProfilePoint[] = physical[0]!;
  const holes: IAutoMovieProfilePoint[][] = [
    ...physical.slice(1),
    ...slab.slice(walls.length),
  ];
  if (
    !polygonInside(outer, walls[0]!) ||
    walls
      .slice(1)
      .some(
        (hole: IAutoMovieProfilePoint[], index: number): boolean =>
          !polygonInside(hole, physical[index + 1]!),
      )
  )
    throw new Error(`${path} cannot retain a usable floor between its walls`);
  let region: IAutoMovieRegionTriangulation;
  try {
    region = triangulateAutoMovieRegion({ outer, holes });
  } catch (error) {
    throw new Error(
      `${path} has no usable wall setback: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (
    pointInPolygon(anchor, outer) &&
    !holes.some((hole: IAutoMovieProfilePoint[]): boolean =>
      pointInPolygon(anchor, hole),
    )
  )
    return { rings: [outer, ...holes], anchor };
  const a: IAutoMovieProfilePoint = region.points[region.triangles[0]!]!;
  const b: IAutoMovieProfilePoint = region.points[region.triangles[1]!]!;
  const c: IAutoMovieProfilePoint = region.points[region.triangles[2]!]!;
  return {
    rings: [outer, ...holes],
    anchor: {
      x: a.x + (b.x + c.x - 2 * a.x) / 3,
      y: a.y + (b.y + c.y - 2 * a.y) / 3,
    },
  };
}

/** Intersect inward parallel edge lines at each miter, refusing a reversed offset edge. */
function insetRing(
  ring: readonly IAutoMovieProfilePoint[],
  distance: number,
  path: string,
): IAutoMovieProfilePoint[] {
  const normals: IAutoMovieProfilePoint[] = ring.map(
    (a: IAutoMovieProfilePoint, i: number): IAutoMovieProfilePoint => {
      const b: IAutoMovieProfilePoint = ring[(i + 1) % ring.length]!;
      const dx: number = b.x - a.x;
      const dy: number = b.y - a.y;
      const length: number = Math.hypot(dx, dy);
      return { x: -dy / length, y: dx / length };
    },
  );
  const inner: IAutoMovieProfilePoint[] = ring.map(
    (p: IAutoMovieProfilePoint, i: number): IAutoMovieProfilePoint => {
      const a: IAutoMovieProfilePoint =
        normals[(i + ring.length - 1) % ring.length]!;
      const b: IAutoMovieProfilePoint = normals[i]!;
      // The sum of the normals has dot product 1 + cos(turn) with
      // either one. Scaling sets the perpendicular clearance to distance.
      const scale: number = distance / (1 + a.x * b.x + a.y * b.y);
      return { x: p.x + (a.x + b.x) * scale, y: p.y + (a.y + b.y) * scale };
    },
  );
  for (let i: number = 0; i < ring.length; ++i) {
    const from: IAutoMovieProfilePoint = inner[i]!;
    const to: IAutoMovieProfilePoint = inner[(i + 1) % ring.length]!;
    const normal: IAutoMovieProfilePoint = normals[i]!;
    const advance: number =
      (to.x - from.x) * normal.y - (to.y - from.y) * normal.x;
    if (!Number.isFinite(advance) || advance <= 0)
      throw new Error(
        `${path} has a collapsed wall setback; widen the room or use thinner walls`,
      );
  }
  return inner;
}
