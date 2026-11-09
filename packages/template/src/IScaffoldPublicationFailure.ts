import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";

/**
 * The entry where publication stopped and its non-completed outcome.
 *
 * @evidence contracts/development/design.md#principled-representation Publication is sequential and stops at the first non-completed outcome, so one failure record fully describes the stop and every later entry is known untouched.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The outcome type excludes `completed` through `Exclude`, so the failure cannot claim success and no separate failure union is maintained.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record keeps the adapter's outcome as reported after validation, without reclassifying a partial slot as a refusal.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names the stopping entry and distinguishes refusal before that target file changed from a partial file effect; existing competitors and directory preparation are outside this per-file record.
 */
export interface IScaffoldPublicationFailure {
  /** Planned entry where publication stopped. */
  entry: IScaffoldPublicationEntry;

  /** Refusal before target-file mutation or an incomplete file effect observed at that entry. */
  outcome: Exclude<ScaffoldFilePublicationOutcome, { status: "completed" }>;
}
