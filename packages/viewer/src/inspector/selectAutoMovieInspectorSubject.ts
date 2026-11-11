import type { IAutoMovieInspectorSubject } from "./IAutoMovieInspectorSubject.js";

/**
 * The subject a request's `subject` key names among the subjects an inspector is given.
 *
 * A name selects the subject of that name; null selects the only subject, as the capture command reads an absent `subject`. It throws, listing the names, for a name no subject has, for null among several subjects, and for an empty list.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a name and null select and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Null means the host's only subject in the plan grammar, so the page refuses it among several exactly as the command does, and the same address names the same subject in both.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and three refusals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Null among several subjects is refused instead of taking the first.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the subjects.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure lookup.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a borrowed subject and keeps nothing.
 */
export function selectAutoMovieInspectorSubject(
  subjects: readonly IAutoMovieInspectorSubject[],
  name: string | null,
): IAutoMovieInspectorSubject {
  const names: string = subjects
    .map((subject: IAutoMovieInspectorSubject): string => subject.name)
    .join(", ");
  if (subjects.length === 0) throw new Error("The inspector has no subject");
  if (name === null) {
    if (subjects.length === 1) return subjects[0]!;
    throw new Error(`Name a subject: the subjects are ${names}`);
  }
  const found: IAutoMovieInspectorSubject | undefined = subjects.find(
    (subject: IAutoMovieInspectorSubject): boolean => subject.name === name,
  );
  if (found === undefined)
    throw new Error(`Subject "${name}" is not one of ${names}`);
  return found;
}
