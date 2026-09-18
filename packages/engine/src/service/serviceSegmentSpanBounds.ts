import { IAutoMoviePropBox, IAutoMovieServiceSegment } from "@automovie/interface";

/**
 * The world volume one run occupies, span by span.
 *
 * Each straight leg of the centre line gets its own box grown by the run's
 * radius, because one box around a whole polyline is not a pipe: a run that
 * drops, turns and crosses a building would claim the entire cuboid those three
 * legs span and clash with everything inside it. Per-span boxes stay tight on
 * orthogonal routing, which is how distribution is actually run, and remain
 * conservative on a diagonal — a bias that reports a near miss rather than
 * missing a real interference.
 *
 * A route with fewer than two points has no span and yields nothing to compare;
 * the validator refuses that route on its own path.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceSegmentSpanBounds` gives every straight route leg its own radius-expanded occupied volume for precise interference checks.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceSegmentSpanBounds` derives one conservative axis-aligned box per adjacent centre-line point pair and none for a spanless route.
 * @author Samchon
 */
export const serviceSegmentSpanBounds = (
  segment: IAutoMovieServiceSegment,
): IAutoMoviePropBox[] => {
  const spans: IAutoMoviePropBox[] = [];
  const pad = segment.radius;
  for (let index = 0; index + 1 < segment.route.length; ++index) {
    const one = segment.route[index]!;
    const next = segment.route[index + 1]!;
    spans.push({
      min: {
        x: Math.min(one.x, next.x) - pad,
        y: Math.min(one.y, next.y) - pad,
        z: Math.min(one.z, next.z) - pad,
      },
      max: {
        x: Math.max(one.x, next.x) + pad,
        y: Math.max(one.y, next.y) + pad,
        z: Math.max(one.z, next.z) + pad,
      },
    });
  }
  return spans;
};
