import {
  IAutoMoviePropBox,
  IAutoMovieServiceSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Each consecutive leg's coordinate extrema padded by radius form an AABB enclosing that swept segment; diagonal routing deliberately yields conservative rather than exact circular interference.
 * @evidence contracts/common.md#clear-and-simple-design Clash and maintenance checks consume the same per-leg boxes so a polyline does not claim its entire global bounding cuboid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No route resampling or discipline-specific thickness replaces the authored radius, and fewer than two points expose no measurable span.
 * @evidence contracts/common.md#meaningful-documentation Describes world-volume units, per-leg meaning, diagonal conservatism and malformed-route empty behavior delegated to validation.
 * @evidence contracts/performance.md#efficient-algorithms R points emit at most R-minus-one boxes in O(R) time and output space, proportional to the authored route population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pairwise consumers can reuse these boxes within their call; this query retains no span table across route mutations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every emitted corner is a new scalar record and the caller owns the array, without source-route retention.
 *
 * @author Samchon
 */
export const serviceSegmentSpanBounds: (
  segment: IAutoMovieServiceSegment,
) => IAutoMoviePropBox[] = (
  segment: IAutoMovieServiceSegment,
): IAutoMoviePropBox[] => {
  const spans: IAutoMoviePropBox[] = [];
  const pad: number = segment.radius;
  for (let index: number = 0; index + 1 < segment.route.length; ++index) {
    const one: IAutoMovieVector3 = segment.route[index]!;
    const next: IAutoMovieVector3 = segment.route[index + 1]!;
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
