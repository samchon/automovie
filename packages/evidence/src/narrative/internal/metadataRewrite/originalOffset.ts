import type { IProjectionSegment } from "./IProjectionSegment";
import type { IProtectedProjection } from "./IProtectedProjection";

/**
 * Maps a projected byte offset back to the exact original source offset.
 *
 * @evidence contracts/common.md#principled-implementation Locate the protected span containing an offset and add its displacement; projected EOF maps to source EOF.
 * @evidence contracts/common.md#clear-and-simple-design Existing span mappings reconnect projection diagnostics to original bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmatched spans fall back to source EOF rather than invented interior coordinates.
 * @evidence contracts/common.md#meaningful-documentation The comment states source-offset mapping; coordinates are byte offsets.
 * @evidence contracts/performance.md#efficient-algorithms Linear find examines up to S segments with constant auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work The projection's existing segments are reused without source reparsing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The projection is borrowed; no reference persists after return.
 */
export function originalOffset(
  projection: IProtectedProjection,
  projectedOffset: number,
): number {
  if (projectedOffset >= projection.bytes.length)
    return projection.original.length;
  const segment: IProjectionSegment | undefined = projection.segments.find(
    (candidate: IProjectionSegment): boolean =>
      projectedOffset >= candidate.projectedStart &&
      projectedOffset < candidate.projectedStart + candidate.length,
  );
  if (segment === undefined) return projection.original.length;
  return segment.originalStart + projectedOffset - segment.projectedStart;
}
