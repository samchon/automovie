import type {
  IAutoMovieConstraintViolation,
  IAutoMovieEditorialMarker,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/** Append located violations for invalid editorial markers on a shot clock. */
export function appendEditorialMarkersArtifact(
  markers: readonly IAutoMovieEditorialMarker[],
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void {
  const ids: Set<string> = new Set();
  markers.forEach((marker: IAutoMovieEditorialMarker, index: number): void => {
    const row: string = `${path}[${index}]`;
    if (marker.label.trim().length === 0)
      pushViolation(
        violations,
        "type",
        `${row}.label`,
        "editorial marker label must be non-blank",
        marker.label,
      );
    if (ids.has(marker.id))
      pushViolation(
        violations,
        "type",
        `${row}.id`,
        "editorial marker id must be unique within the shot",
        marker.id,
      );
    ids.add(marker.id);

    const start: number = marker.startSeconds;
    const end: number = marker.endSeconds;
    if (start < 0 || start >= duration)
      pushViolation(
        violations,
        "range",
        `${row}.startSeconds`,
        "editorial marker start must be finite and within the playable shot",
        start,
      );
    if (end < 0 || end > duration || end < start)
      pushViolation(
        violations,
        "range",
        `${row}.endSeconds`,
        "editorial marker end must be finite, at or after its start, and within the shot",
        end,
      );
  });
}
