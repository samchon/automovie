import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";

/**
 * Name one subject as a single string both sides of a review can pass around.
 *
 * The form is `kind:id` and, when a revision is stated, `kind:id@revision`.
 * This is what a finding carries instead of a screenshot: the reviewer writes
 * it into the report, the authoring agent pastes it back into the harness, and
 * neither is reasoning about a private reconstruction of the model.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-identity `autoMovieViewerSubjectKey` renders one subject identity and revision as the stable name by which it is pointed at and opened alone.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-record `autoMovieViewerSubjectKey` serializes the subject record's identity fields into one portable target string.
 * @author Samchon
 */
export const autoMovieViewerSubjectKey = (
  subject: IAutoMovieViewerSubject,
): string =>
  subject.revision === null
    ? `${subject.kind}:${subject.id}`
    : `${subject.kind}:${subject.id}@${subject.revision}`;
