import { type IScaffoldCompletedPublication } from "./IScaffoldCompletedPublication";
import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
import { type IScaffoldPublicationFailure } from "./IScaffoldPublicationFailure";

/**
 * Everything observed while publishing one candidate.
 *
 * Entries are published in candidate order and publication stops at the first entry that does not complete, so `completed` is a prefix of `planned` and every entry after `failure` was not attempted.
 *
 * @evidence contracts/development/design.md#principled-representation The receipt is a prefix description of a sequential, stop-at-first-failure loop, so `completed`, `failure`, and `planned` together determine every file's state without a per-entry status list.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The candidate-wide `status` is derived from the other fields by `publishScaffoldCandidate`, and the throwing form in `writeFiles` and the CLI both decide success from that one field.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `refused` means the first entry had no file mutation; completed or partial file effects remain partial candidate outcomes, and the receipt makes no promise that directory preparation left nothing behind.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the ordering, the prefix property, what is untouched after the failure, and how each candidate-wide status is derived.
 */
export interface IScaffoldPublicationReceipt {
  /** Entries completed before publication stopped, in candidate order. */
  completed: readonly IScaffoldCompletedPublication[];

  /** Entry where publication stopped, or `null` when every entry completed. */
  failure: IScaffoldPublicationFailure | null;

  /** The whole candidate in publication order, attempted or not. */
  planned: readonly IScaffoldPublicationEntry[];

  /**
   * `completed` when every entry completed, `refused` when the first entry was refused before any target file changed, and `partial` otherwise. Prepared directories and existing competitors are not described by this status.
   */
  status: "completed" | "partial" | "refused";
}
