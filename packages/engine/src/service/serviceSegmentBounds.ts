import { IAutoMoviePropBox, IAutoMovieServiceSegment } from "@automovie/interface";

/**
 * The single world volume a whole run is contained by.
 *
 * This is the broad-phase companion to {@link serviceSegmentSpanBounds}: one box
 * a caller can index, cull or draw a bounding volume from without walking every
 * leg. Interference is decided on the spans, never on this.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceSegmentBounds` provides the single world box containing an entire service run for drawing, indexing, and broad-phase lookup.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceSegmentBounds` envelopes all route coordinates plus the declared radius and rejects a route with no point to bound.
 * @author Samchon
 */
export const serviceSegmentBounds = (
  segment: IAutoMovieServiceSegment,
): IAutoMoviePropBox => {
  const first = segment.route[0];
  if (first === undefined)
    throw new Error(
      `service segment "${segment.id}" has no route to take a bound from`,
    );
  const min = { x: first.x, y: first.y, z: first.z };
  const max = { x: first.x, y: first.y, z: first.z };
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
