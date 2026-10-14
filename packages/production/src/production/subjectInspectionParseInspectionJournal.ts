
import typia from "typia";
import { IAutoMovieSubjectInspectionAttemptRecord } from "./IAutoMovieSubjectInspectionAttemptRecord";
import { IAutoMovieSubjectInspectionAttemptJournal } from "./IAutoMovieSubjectInspectionAttemptJournal";

/**
 * Admit a same-plan journal with canonical attempt numbering and terminal reasons.
 *
 * @evidence contracts/common.md#principled-implementation Strict schema and plan equality require attempt numbers equal array ordinal plus one, passed iff reason is null, and unique record paths within each attempt.
 * @evidence contracts/common.md#clear-and-simple-design Journal semantics are admitted before mutation and reopening observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths are not physically verified here; blank failure reasons and per-view repeats across different attempts are not separately refused.
 * @evidence contracts/common.md#meaningful-documentation Returns original validated history and preserves its monotonic array order.
 * @evidence contracts/performance.md#efficient-algorithms Schema/attempt traversal plus per-attempt observation sets scale with history and path populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One validated journal supplies all checks; every physical read/mutation obtains a new current snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains input journal arrays and temporary uniqueness sets leave admission; history has no fixed retention cap.
 */
export function subjectInspectionParseInspectionJournal(
  value: unknown,
  planIdentity: string
): IAutoMovieSubjectInspectionAttemptJournal {
  const validation: typia.IValidation.IFailure | typia.IValidation.ISuccess<IAutoMovieSubjectInspectionAttemptJournal> =
    typia.validateEquals<IAutoMovieSubjectInspectionAttemptJournal>(value);
  if (validation.success === false)
    throw new Error(
      `Invalid subject-inspection attempt journal: ${validation.errors
        .map((error: typia.IValidation.IError) : string => `${error.path} expects ${error.expected}`)
        .join("; ")}`,
    );
  const journal: IAutoMovieSubjectInspectionAttemptJournal = validation.data;
  if (
    journal.planIdentity !== planIdentity ||
    journal.attempts.some(
      (attempt: IAutoMovieSubjectInspectionAttemptRecord, index: number) : boolean =>
        attempt.attempt !== index + 1 ||
        (attempt.verdict === "passed") !== (attempt.reason === null) ||
        new Set(attempt.observations).size !== attempt.observations.length,
    )
  )
    throw new Error(
      "Subject-inspection attempt journal is not canonical for its plan identity.",
    );
  return journal;
}
