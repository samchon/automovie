import type { AutoMovieViewerSubjectKind } from "./AutoMovieViewerSubjectKind.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";

/**
 * Read a subject key back into an identity.
 *
 * Refuses anything it cannot resolve rather than guessing a kind, because a
 * guessed kind is exactly the prototype-placement confusion the requirement
 * forbids: the same authored name can be both a model and an element placing
 * it, and answering the wrong one looks like agreement while the two sides are
 * looking at different things.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-identity `parseAutoMovieViewerSubjectKey` resolves a portable subject name back to its kind, identity, and revision without inferring an unstated kind.
 * @evidence requirements/review/subject-inspection.md#review-observable-judgeable-parity `parseAutoMovieViewerSubjectKey` refuses any public subject target that cannot be opened as its own observation unit.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-target-parity `parseAutoMovieViewerSubjectKey` refuses a target it cannot resolve to a subject unit instead of substituting a neighbouring one.
 * @author Samchon
 */
export const parseAutoMovieViewerSubjectKey = (
  key: string,
): IAutoMovieViewerSubject => {
  const separator = key.indexOf(":");
  if (separator === -1)
    throw new Error(
      `subject key "${key}" names no kind; write it as "<kind>:<id>"`,
    );
  const kind = key.slice(0, separator);
  if (SUBJECT_KINDS.has(kind) === false)
    throw new Error(
      `subject key "${key}" names unknown kind "${kind}"; known kinds are ${[
        ...SUBJECT_KINDS,
      ].join(", ")}`,
    );
  const rest = key.slice(separator + 1);
  // Last `@` wins, so an id that legitimately contains one keeps it and only
  // the trailing revision is split off.
  const revisionAt = rest.lastIndexOf("@");
  const id = revisionAt === -1 ? rest : rest.slice(0, revisionAt);
  const revision = revisionAt === -1 ? null : rest.slice(revisionAt + 1);
  if (id.length === 0)
    throw new Error(`subject key "${key}" names no id after its kind`);
  if (revision !== null && revision.length === 0)
    throw new Error(`subject key "${key}" ends in an empty revision`);
  return { kind: kind as AutoMovieViewerSubjectKind, id, revision };
};

const SUBJECT_KINDS: ReadonlySet<string> = new Set<AutoMovieViewerSubjectKind>([
  "built-environment",
  "building",
  "storey",
  "space",
  "element",
  "part",
  "model",
  "prototype",
  "mesh",
  "primitive",
  "formation",
  "slot",
  "instance-set",
  "instance",
]);
