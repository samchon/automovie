import type {
  IAutoMovieConstraintViolation,
  IAutoMovieEditorialMarker,
} from "@automovie/interface";

import { appendEditorialMarkersArtifact } from "./appendEditorialMarkersArtifact";

/**
 * Admit the performance's optional editorial marker list and copy its data
 * before the other shot compilers read the staged performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Omitted input stays absent; invalid input contributes shot-local violations and a clean list yields owned canonical records.
 * @evidence contracts/development/implementation.md#principled-implementation Validate against the authored shot duration and copy the four declared fields only after the validation adds no violations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This authoring boundary reuses the stored-shot validator and prepares the build artifact's marker records.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No marker or endpoint is added, removed or rewritten after admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear validation and one copy of each admitted marker.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shot builder holds the admitted copies while the shared validator continues to serve artifact readers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fresh marker records escape, and no resource or state is retained.
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
