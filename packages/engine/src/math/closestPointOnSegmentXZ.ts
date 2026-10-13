import { IAutoMovieVector3 } from "@automovie/interface";
import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";
/**
 * Closest horizontal point on the closed start/end segment, with returned Y zero.
 * Exact coincident endpoints remain a point; every nonzero span remains a segment.
 * Coordinates share one metre frame. The shared segment query's finite arithmetic
 * admission and binary64 witness precision apply after height is discarded.
 *
 * @evidence contracts/common.md#principled-implementation Zero-height projection lifts the horizontal point and endpoints into the shared constrained segment quadratic, preserving exact collapsed spans and tiny nonzero segments.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns XZ projection; closestPointsBetweenSegments owns bounded witness selection for support-hull edges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ignored height follows the horizontal contract, while no absolute squared-length floor collapses small real edges.
 * @evidence contracts/common.md#meaningful-documentation States horizontal coordinates, zero returned height, bounded endpoints and exact collapsed-span behavior.
 * @evidence contracts/performance.md#efficient-algorithms The fixed candidate set of the shared segment solver keeps projection constant in time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each hull edge supplies different endpoints; no stale projection is cached between edge queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lifted input records are temporary, and the returned closest witness belongs exclusively to the caller.
 */
export const closestPointOnSegmentXZ: (point: Pick<IAutoMovieVector3, "x" | "z">, start: Pick<IAutoMovieVector3, "x" | "z">, end: Pick<IAutoMovieVector3, "x" | "z">) => IAutoMovieVector3 = (
  point: Pick<IAutoMovieVector3, "x" | "z">,
  start: Pick<IAutoMovieVector3, "x" | "z">,
  end: Pick<IAutoMovieVector3, "x" | "z">,
): IAutoMovieVector3 => {
  const query: IAutoMovieVector3 = { x: point.x, y: 0, z: point.z };
  return closestPointsBetweenSegments(
    query,
    query,
    { x: start.x, y: 0, z: start.z },
    { x: end.x, y: 0, z: end.z },
  ).pointB;
};
