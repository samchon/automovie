import type { IProjectionSegment } from "./IProjectionSegment";
import type { IProtectedProjection } from "./IProtectedProjection";

/** Maps a projected byte offset back to the exact original source offset. */
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
