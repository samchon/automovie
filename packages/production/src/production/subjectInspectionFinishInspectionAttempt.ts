import { IAutoMovieSubjectInspectionAttemptRecord } from "./IAutoMovieSubjectInspectionAttemptRecord";
import { IAutoMovieSubjectInspectionAttemptJournal } from "./IAutoMovieSubjectInspectionAttemptJournal";
import { subjectInspectionMutateInspectionJournal } from "./subjectInspectionMutateInspectionJournal";

/**
 * Set an existing attempt's terminal verdict and reason in the shared journal.
 *
 * @evidence contracts/common.md#principled-implementation One journal transaction updates the supplied attempt's verdict/reason in place before publication.
 * @evidence contracts/common.md#clear-and-simple-design The sweep's terminal branches decide outcome and this function owns durable recording only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It assumes an existing attempt and consistent verdict/reason; canonical journal validation occurs on subsequent reads, not after this mutation.
 * @evidence contracts/common.md#meaningful-documentation Passed normally pairs with null reason while failure text remains verbatim history.
 * @evidence contracts/performance.md#efficient-algorithms Full-journal transaction cost dominates the two field assignments.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared transaction ownership keeps numbering/history format aligned with begin and per-view recording.
 * @evidence contracts/performance.md#bound-retention-and-release-resources History remains on disk without eviction and the transaction owns lock release; no running host task is retained here.
 */
export function subjectInspectionFinishInspectionAttempt(
  props: {
  root: string;
  directory: string;
  planIdentity: string;
  attempt: number;
  verdict: IAutoMovieSubjectInspectionAttemptRecord["verdict"];
  reason: string | null;
}
): void { return subjectInspectionMutateInspectionJournal(props, (journal: IAutoMovieSubjectInspectionAttemptJournal) : void => {
    const attempt: IAutoMovieSubjectInspectionAttemptRecord = journal.attempts[props.attempt - 1]!;
    attempt.verdict = props.verdict;
    attempt.reason = props.reason;
  }); }
