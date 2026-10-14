import { IAutoMoviePropBox, IAutoMovieServiceSegment, IAutoMovieVector3 } from "@automovie/interface";
/**
 * The single world volume a whole run is contained by.
 *
 * This is the broad-phase companion to {@link serviceSegmentSpanBounds}: one box
 * a caller can index, cull or draw a bounding volume from without walking every
 * leg. Interference is decided on the spans, never on this.
 * Coordinates and radius use metres and must already be admitted; empty routes
 * throw, while a singleton gives its radius-padded point box. No live product
 * caller currently consumes this broad-phase query.
 *
 * @evidence contracts/common.md#principled-implementation Coordinate minima/maxima of all route vertices, padded by uniform radius, contain every straight swept span as a conservative world AABB.
 * @evidence contracts/common.md#clear-and-simple-design This whole-route query is distinct from per-leg clash bounds, but currently reaches only service geometry tests rather than a production broad phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty routes refuse by segment id instead of returning an invented origin volume; the box is not presented as an exact pipe surface.
 * @evidence contracts/common.md#meaningful-documentation Names broad-phase meaning, metre/admitted-input premise, empty/singleton behavior and the missing product consumer.
 * @evidence contracts/performance.md#efficient-algorithms R route vertices require three coordinate comparisons each, O(R) time with fixed two-corner working storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A bound belongs to the current radius and route; no geometry-version cache or cross-segment reuse is maintained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Working and returned corners contain scalar copies only, so releasing the result leaves no source-route references.
 *
 * @author Samchon
 */
export const serviceSegmentBounds: (segment: IAutoMovieServiceSegment) => IAutoMoviePropBox = (
  segment: IAutoMovieServiceSegment,
): IAutoMoviePropBox => {
  const first: IAutoMovieVector3 = segment.route[0];
  if (first === undefined)
    throw new Error(
      `service segment "${segment.id}" has no route to take a bound from`,
    );
  const min: { x: number; y: number; z: number; } = { x: first.x, y: first.y, z: first.z };
  const max: { x: number; y: number; z: number; } = { x: first.x, y: first.y, z: first.z };
  for (const point of segment.route)
    for (const axis of ["x", "y", "z"] as const) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
  return {
    min: {
      x: min.x - segment.radius,
      y: min.y - segment.radius,
      z: min.z - segment.radius,
    },
    max: {
      x: max.x + segment.radius,
      y: max.y + segment.radius,
      z: max.z + segment.radius,
    },
  };
};
