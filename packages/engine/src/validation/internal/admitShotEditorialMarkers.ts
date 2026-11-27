import type {
  IAutoMovieConstraintViolation,
  IAutoMovieEditorialMarker,
} from "@automovie/interface";

import { appendEditorialMarkersArtifact } from "./appendEditorialMarkersArtifact";

/*
 * Admit the performance's optional editorial marker list and copy its data
 * before the other shot compilers read the staged performance.
 */
export function admitShotEditorialMarkers(
  markers: readonly IAutoMovieEditorialMarker[] | undefined,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): IAutoMovieEditorialMarker[] | undefined {
  if (markers === undefined) return undefined;
  const previous: number = violations.length;
  appendEditorialMarkersArtifact(
    markers,
    "$input.editorialMarkers",
    duration,
    violations,
  );
  if (previous !== violations.length) return undefined;
  return markers.map(({ id, label, startSeconds, endSeconds }) => ({
    id,
    label,
    startSeconds,
    endSeconds,
  }));
}
