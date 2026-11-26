import type {
  IAutoMovieProjectionIntervals,
  IAutoMovieVector3,
} from "@automovie/interface";

import { adjacentAutoMovieFloat64 as outward } from "../math/internal/adjacentAutoMovieFloat64";

/**
 * Enclose each point's projection onto a stored direction in an outward rounded
 * interval, relative to an origin.
 *
 * Points, origin and direction share one metre frame. The direction is scaled
 * so its largest absolute component is one, and is taken as stored: rounding in
 * how a caller proposed it never matters, because the intervals enclose the
 * projections of the supplied points onto exactly this direction. The result
 * also carries an upper enclosure of that scaled direction's norm, so a caller
 * can turn an interval gap into a Euclidean lower bound. A zero direction
 * yields `[0, 0]` for every point and a zero norm, which proves no separation.
 * The origin defaults to the first point.
 *
 * Throws on an empty point run, a missing or non-finite coordinate in a point,
 * the origin or the direction, and, through `adjacentAutoMovieFloat64`, on a
 * difference or enclosure step that overflows. Projection separation and
 * attachment contact are the two consumers.
 *
 * @param points Points to project, read only.
 * @param raw Stored direction, read only.
 * @param origin Reference point the projections are measured from.
 * @returns One owned interval per point and the norm enclosure.
 */
export function measureAutoMovieProjectionIntervals(
  points: readonly IAutoMovieVector3[],
  raw: IAutoMovieVector3,
  origin: IAutoMovieVector3 = points[0]!,
): IAutoMovieProjectionIntervals {
  let admitted: boolean = points.length > 0;
  // An index loop, unlike `every`, also visits holes in a sparse run.
  for (let index: number = 0; admitted && index < points.length; index++)
    admitted = finite(points[index]);
  if (!admitted)
    throw new Error(
      "Projection intervals require nonempty finite points and direction.",
    );
  const scale: number = Math.max(
    Math.abs(raw.x),
    Math.abs(raw.y),
    Math.abs(raw.z),
  );
  if (scale === 0)
    return {
      intervals: points.map((): [number, number] => [0, 0]),
      normUpper: 0,
    };
  const direction: IAutoMovieVector3 = {
    x: raw.x / scale,
    y: raw.y / scale,
    z: raw.z / scale,
  };
  let norm2: number = 0;
  for (const value of [direction.x, direction.y, direction.z])
    norm2 = outward(norm2 + outward(value * value, true), true);
  let normUpper: number = Math.sqrt(norm2);
  while (outward(normUpper * normUpper, false) < norm2)
    normUpper = outward(normUpper, true);
  const intervals: [number, number][] = points.map(
    (point: IAutoMovieVector3): [number, number] => {
      let low: number = 0;
      let high: number = 0;
      for (const axis of AXES) {
        const component: number = direction[axis];
        if (component === 0) continue;
        const difference: number = point[axis] - origin[axis];
        const below: number = outward(difference, false) * component;
        const above: number = outward(difference, true) * component;
        low = outward(low + outward(Math.min(below, above), false), false);
        high = outward(high + outward(Math.max(below, above), true), true);
      }
      return [low, high];
    },
  );
  return { intervals, normUpper };
}

/** The three coordinate names, read in a fixed order. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/** Whether a slot holds a vector with three finite coordinates. */
const finite = (point: IAutoMovieVector3 | undefined | null): boolean =>
  point !== undefined && point !== null;
