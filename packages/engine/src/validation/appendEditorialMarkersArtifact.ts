import type {
  IAutoMovieConstraintViolation,
  IAutoMovieEditorialMarker,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Append located violations for malformed editorial markers on a shot clock.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Validates dense object rows, nonblank ids and labels, exact id uniqueness and finite endpoints with `0 <= start < duration` and `start <= end <= duration`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One validator serves authored and stored shot inputs through canonical shallow shape, text and violation helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Indexed traversal reports sparse entries. Id and time values are preserved, without repairing or discarding bad markers.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies located append-only violations, the shot clock and equal endpoints as the point form.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits each marker once with an id set and fixed field work plus text handling.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same admission serves performance gates and shot artifact inspection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The id set is local. Only violations and their offending values are retained by the caller.
 */
export function appendEditorialMarkersArtifact(
  markers: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void {
  if (!validateArrayArtifact(markers, path, "editorial markers", violations))
    return;

  const ids: Set<string> = new Set();
  for (let index: number = 0; index < markers.length; ++index) {
    const marker: unknown = markers[index];
    const row: string = `${path}[${index}]`;
    if (!validateObjectArtifact(marker, row, "editorial marker", violations))
      continue;

    const id: unknown = marker.id;
    validateNonEmptyId(id, `${row}.id`, "editorial marker id", violations);
    validateNonEmptyId(
      marker.label,
      `${row}.label`,
      "editorial marker label",
      violations,
    );
    if (typeof id === "string" && id.trim().length > 0) {
      if (ids.has(id))
        pushViolation(
          violations,
          "type",
          `${row}.id`,
          "editorial marker id must be unique within the shot",
          id,
        );
      ids.add(id);
    }

    const start: unknown = marker.startSeconds;
    const end: unknown = marker.endSeconds;
    if (
      typeof start !== "number" ||
      !Number.isFinite(start) ||
      start < 0 ||
      start >= duration
    )
      pushViolation(
        violations,
        "range",
        `${row}.startSeconds`,
        "editorial marker start must be finite and within the playable shot",
        start,
      );
    if (
      typeof end !== "number" ||
      !Number.isFinite(end) ||
      end < 0 ||
      end > duration ||
      (typeof start === "number" && end < start)
    )
      pushViolation(
        violations,
        "range",
        `${row}.endSeconds`,
        "editorial marker end must be finite, at or after its start, and within the shot",
        end,
      );
  }
}

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
