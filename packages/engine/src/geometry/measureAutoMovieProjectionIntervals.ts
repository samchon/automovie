import type { IAutoMovieVector3 } from "@automovie/interface";

import { adjacentAutoMovieFloat64 as outward } from "../math/adjacentAutoMovieFloat64";
import type { IAutoMovieProjectionIntervals } from "./IAutoMovieProjectionIntervals";

/**
 * Enclose each point's projection onto a stored direction in an outward
 * rounded interval, relative to an origin.
 *
 * Points, origin and direction share one metre frame. The direction is scaled
 * so its largest absolute component is one, and is taken as stored: rounding
 * in how a caller proposed it never matters, because the intervals enclose
 * the projections of the supplied points onto exactly this direction. The
 * result also carries an upper enclosure of that scaled direction's norm, so a
 * caller can turn an interval gap into a Euclidean lower bound. A zero
 * direction yields `[0, 0]` for every point and a zero norm, which proves no
 * separation. The origin defaults to the first point.
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
 *
 * @evidence contracts/common.md#principled-implementation Interval arithmetic with directed one-ulp widening: each rounded difference, product and sum is replaced by its adjacent binary64 neighbours, which bracket the exact value under round-to-nearest, and the norm is raised until its rounded-down square covers the rounded-up squared norm, so every true projection lies in its interval and the true norm never exceeds `normUpper`.
 * @evidence contracts/common.md#clear-and-simple-design The single owner of enclosed projection arithmetic for `boundAutoMovieProjectionSeparation` and `boundAutoMovieTriangleAttachmentContact`, which only compare interval ends and divide by the norm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No spatial tolerance widens an interval; the only widening is the adjacent-float step after each rounded operation, and overflow refuses instead of returning an infinite interval.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the direction scaling and why rounding of the proposal is harmless, what the norm enclosure is for, the zero-direction result, the default origin, every refusal and the consumers.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the point count n: one finiteness pass and, per point, at most three axis terms of a few adjacent-float steps each, allocating only the n result tuples.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of its arguments; each separation or contact bound asks for one direction once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns owned tuples and a number and keeps no reference to the inputs; the shared adjacent-float buffer is answered on its owner.
 * @author Samchon
 */
export function measureAutoMovieProjectionIntervals(
  points: readonly IAutoMovieVector3[],
  raw: IAutoMovieVector3,
  origin: IAutoMovieVector3 = points[0]!,
): IAutoMovieProjectionIntervals {
  let admitted: boolean = points.length > 0 && finite(raw) && finite(origin);
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
  point !== undefined &&
  point !== null &&
  Number.isFinite(point.x) &&
  Number.isFinite(point.y) &&
  Number.isFinite(point.z);
