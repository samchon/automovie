import { AutoMovieEngineSpace, intersectAutoMovieConvexPolygons, signedArea, surfaceHeightAt, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieFootprint,
  IAutoMovieFootprintRing,
  IAutoMovieHeightRule,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { prepareTerrainGrades } from "./prepareTerrainGrades";

/** A named path with world-metre waypoints and applicable grade limits. */
type IPath = ReturnType<typeof prepareTerrainGrades>["paths"][number];

/**
 * Check a named route against the accepted support surface.
 *
 * @param path Resolved world-metre waypoints, fixed heights and optional slope
 *   limit.
 * @param footprint Closed rectangular parcel with its excluded hole rings.
 * @param rule World height authority retained for staging and rendering.
 * @throws If the prescribed width misses support, a waypoint misses its fixed
 *   height or the slope is infeasible.
 */
export function admitTerrainRoute(
  path: IPath,
  footprint: IAutoMovieFootprint,
  rule: IAutoMovieHeightRule,
): void {
  const obstructions: IAutoMovieVector3[][] = footprint.holes.flatMap(
    (outer: IAutoMovieFootprintRing): IAutoMovieVector3[][] =>
      AutoMovieEngineSpace.footprintConvexPieces({ outer, holes: [] }),
  );
  for (const [index, point] of path.points.entries()) {
    if (!AutoMovieEngineSpace.footprintContains(footprint, point.x, point.z))
      throw new Error(
        `Terrain path "${path.id}" waypoint ${index} is outside parcel land.`,
      );
    const value: number = surfaceHeightAt({ height: rule }, point.x, point.z);
    if (
      path.fixed[index] &&
      Math.abs(value - point.y) >
        8 * Number.EPSILON * Math.max(1, Math.abs(point.y))
    )
      throw new Error(
        `Terrain path "${path.id}" waypoint ${index} needs height ${point.y} m but its shared ground is ${value} m.`,
      );
    if (index > 0 && index + 1 < path.points.length) {
      if (
        distanceToRim(footprint.outer, point) < path.radius ||
        footprint.holes.some(
          (hole: IAutoMovieFootprintRing): boolean =>
            distanceToRim(hole, point) < path.radius,
        )
      )
        throw new Error(
          `Terrain path "${path.id}" turn ${index} cannot fit its ${path.radius * 2} m width on parcel land.`,
        );
    }
  }
  for (const [index, segment] of path.segments.entries()) {
    if (!stripFits(segment, path.radius, footprint.outer, obstructions))
      throw new Error(
        `Terrain path "${path.id}" segment ${index} cannot fit its ${path.radius * 2} m width on parcel land.`,
      );
    if (path.maxSlope !== undefined) {
      const grade: number = routeGrade(segment, rule);
      if (grade - path.maxSlope > 32 * Number.EPSILON * Math.max(1, grade))
        throw new Error(
          `Terrain path "${path.id}" segment ${index} grades to ${grade}, above its limit ${path.maxSlope}.`,
        );
    }
  }
}

/** A butt-ended strip can meet a rim at a door or parcel boundary. */
function stripFits(
  segment: IPath["segments"][number],
  radius: number,
  outer: IAutoMovieFootprintRing,
  obstructions: readonly IAutoMovieVector3[][],
): boolean {
  const { from, to, length }: IPath["segments"][number] = segment;
  const alongX: number = (to.x - from.x) / length;
  const alongZ: number = (to.z - from.z) / length;
  const acrossX: number = -alongZ;
  const acrossZ: number = alongX;
  for (const end of [from, to])
    for (const side of [-radius, radius])
      if (
        AutoMovieEngineSpace.footprintRingPlacement(
          outer,
          end.x + acrossX * side,
          end.z + acrossZ * side,
        ) === "outside"
      )
        return false;

  const strip: readonly (readonly [number, number])[] = [
    [0, -radius],
    [length, -radius],
    [length, radius],
    [0, radius],
  ];
  // Local metre coordinates avoid area cancellation at a translated parcel.
  for (const obstruction of obstructions) {
    const local: [number, number][] = obstruction.map(
      (vertex: IAutoMovieVector3): [number, number] => {
        const x: number = vertex.x - from.x;
        const z: number = vertex.z - from.z;
        return [x * alongX + z * alongZ, x * acrossX + z * acrossZ];
      },
    );
    const intersection: [number, number][] = intersectAutoMovieConvexPolygons(
      local,
      strip,
    );
    const area: number = Math.abs(
      signedArea(
        intersection.map(
          ([x, y]: [number, number]): IAutoMoviePlanarPoint => ({ x, y }),
        ),
      ),
    );
    // Each shoelace term is bounded by length times radius in the clipped frame.
    if (area > Number.EPSILON * intersection.length * length * radius)
      return false;
  }
  return true;
}

/** Radius of the largest clearance disk before meeting this closed ring's rim. */
function distanceToRim(
  ring: IAutoMovieFootprintRing,
  point: IAutoMovieVector3,
): number {
  let distance: number = Infinity;
  for (let edge: number = 0; edge < ring.points.length; edge += 1) {
    const closest: IAutoMovieVector3 = AutoMovieEngineMath.closestPointOnSegmentXZ(
      point,
      ring.points[edge]!,
      ring.points[(edge + 1) % ring.points.length]!,
    );
    distance = Math.min(
      distance,
      Math.hypot(point.x - closest.x, point.z - closest.z),
    );
  }
  return distance;
}

/**
 * Bound centerline slope by evaluating the derivative of each crossed cell's
 * quadratic.
 */
function routeGrade(
  segment: IPath["segments"][number],
  rule: IAutoMovieHeightRule,
): number {
  const { from, to, length }: IPath["segments"][number] = segment;
  const dx: number = to.x - from.x;
  const dz: number = to.z - from.z;
  const cuts: Set<number> = new Set([0, 1]);
  if (rule.kind === "heightfield") {
    addAxisCuts(cuts, from.x, to.x, rule.originX, rule.spacingX);
    addAxisCuts(cuts, from.z, to.z, rule.originZ, rule.spacingZ);
  }
  const times: number[] = [...cuts].sort(
    (a: number, b: number): number => a - b,
  );
  const evaluate: (t: number) => number = (t: number): number =>
    surfaceHeightAt({ height: rule }, from.x + dx * t, from.z + dz * t);
  let max: number = 0;
  for (let index: number = 0; index + 1 < times.length; index += 1) {
    const start: number = times[index]!;
    const end: number = times[index + 1]!;
    const low: number = evaluate(start);
    const middle: number = evaluate((start + end) / 2);
    const high: number = evaluate(end);
    const run: number = length * (end - start);
    const near: number = 4 * (middle - low) - (high - low);
    const far: number = 4 * (high - middle) - (high - low);
    max = Math.max(max, Math.abs(near / run), Math.abs(far / run));
  }
  return max;
}

/** Insert only lattice boundaries strictly between the two axis coordinates. */
function addAxisCuts(
  cuts: Set<number>,
  from: number,
  to: number,
  origin: number,
  spacing: number,
): void {
  const lower: number = Math.min(from, to);
  const upper: number = Math.max(from, to);
  for (
    let index: number = Math.floor((lower - origin) / spacing) + 1;
    index < Math.ceil((upper - origin) / spacing);
    index += 1
  ) {
    const t: number = (origin + index * spacing - from) / (to - from);
    if (0 < t && t < 1) cuts.add(t);
  }
}
