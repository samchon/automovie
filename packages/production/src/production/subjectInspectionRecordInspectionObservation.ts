import { IAutoMovieSubjectInspectionAttemptRecord } from "./IAutoMovieSubjectInspectionAttemptRecord";
import { IAutoMovieSubjectInspectionAttemptJournal } from "./IAutoMovieSubjectInspectionAttemptJournal";
import { subjectInspectionMutateInspectionJournal } from "./subjectInspectionMutateInspectionJournal";

/**
 * Append one passed record path to its already established attempt journal.
 *
 * @evidence contracts/common.md#principled-implementation The common mutation selects attempt ordinal minus one and appends the supplied record path.
 * @evidence contracts/common.md#clear-and-simple-design The sweep performs byte/context publication checks before calling this journal update.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper assumes a valid existing attempt and admitted path; it independently validates neither bytes nor duplicate paths.
 * @evidence contracts/common.md#meaningful-documentation The exact record address becomes durable journal membership after the shared staged rename.
 * @evidence contracts/performance.md#efficient-algorithms Full-journal read/parse/write cost dominates constant selection/append.
 * @evidence contracts/performance.md#reuse-equivalent-work One transaction owner supplies locking and serialization; no separate observation registry is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Disk history retains the path indefinitely unless its owner removes it; mutation releases its token and temporaries.
 */
export function subjectInspectionRecordInspectionObservation(
  props: {
  root: string;
  directory: string;
  planIdentity: string;
  attempt: number;
  record: string;
}
): void { return subjectInspectionMutateInspectionJournal(props, (journal: IAutoMovieSubjectInspectionAttemptJournal) : void => {
    const attempt: IAutoMovieSubjectInspectionAttemptRecord = journal.attempts[props.attempt - 1]!;
    attempt.observations.push(props.record);
  }); }
