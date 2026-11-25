import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";

/**
 * Format a caller-supplied subject as kind:id or kind:id@revision without
 * escaping. Round-trip requires a nonempty id, a nonempty revision without @
 * when present, and an id without @ when revision is null.
 */
export function autoMovieViewerSubjectKey(
  subject: IAutoMovieViewerSubject,
): string {
  return subject.revision === null
    ? `${subject.kind}:${subject.id}`
    : `${subject.kind}:${subject.id}@${subject.revision}`;
}
