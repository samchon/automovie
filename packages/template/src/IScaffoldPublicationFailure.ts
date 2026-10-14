import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";

/**
 * The entry where publication stopped and its non-completed outcome.
 *
 * @evidence contracts/common.md#principled-implementation Publication is sequential and stops at the first non-completed outcome, so one failure record fully describes the stop and every later entry is known untouched.
 * @evidence contracts/common.md#clear-and-simple-design The outcome type excludes `completed` through `Exclude`, so the failure cannot claim success and no separate failure union is maintained.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record keeps the adapter's outcome as reported after validation, without reclassifying a partial slot as a refusal.
 * @evidence contracts/common.md#meaningful-documentation The comment names the stopping entry and distinguishes refusal before that target file changed from a partial file effect; existing competitors and directory preparation are outside this per-file record.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The failure record is two references with no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Only one failure can exist per receipt, so there is nothing equivalent to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record retains the planned entry, including its bytes, and the outcome with its error for as long as a caller holds the record, directly or through a receipt; it acquires no handle or task.
 * @author Samchon
 */
export interface IScaffoldPublicationFailure {
  /** Planned entry where publication stopped. */
  entry: IScaffoldPublicationEntry;

  /** Refusal before target-file mutation or an incomplete file effect observed at that entry. */
  outcome: Exclude<ScaffoldFilePublicationOutcome, { status: "completed" }>;
}
