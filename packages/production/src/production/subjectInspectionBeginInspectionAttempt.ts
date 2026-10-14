import { IAutoMovieSubjectInspectionAttemptJournal } from "./IAutoMovieSubjectInspectionAttemptJournal";
import { subjectInspectionMutateInspectionJournal } from "./subjectInspectionMutateInspectionJournal";

/**
 * Append the next numbered not-run attempt before drawing its viewpoints.
 *
 * @evidence contracts/common.md#principled-implementation Under journal mutation, current history length plus one selects the attempt and an explicit unfinished reason initializes it.
 * @evidence contracts/common.md#clear-and-simple-design One shared journal transaction owns numbering and disk publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An abandoned operation stays not-run rather than being inferred as passed; no automatic history cleanup occurs here.
 * @evidence contracts/common.md#meaningful-documentation Returns the assigned attempt number after its initialized record has been published.
 * @evidence contracts/performance.md#efficient-algorithms Delegated full-journal parse/serialization dominates the fixed append.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing history is extended through the common lock/mutation owner without a second numbering counter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar number escapes; disk attempts remain unbounded history and lock lifetime belongs to the mutation owner.
 */
export function subjectInspectionBeginInspectionAttempt(
  root: string,
  directory: string,
  planIdentity: string
): number {
  let attempt: number = 0;
  subjectInspectionMutateInspectionJournal({ root, directory, planIdentity }, (journal: IAutoMovieSubjectInspectionAttemptJournal) : void => {
    attempt = journal.attempts.length + 1;
    journal.attempts.push({
      attempt,
      verdict: "not-run",
      reason: "The inspection attempt did not reach a terminal outcome.",
      observations: [],
    });
  });
  return attempt;
}
