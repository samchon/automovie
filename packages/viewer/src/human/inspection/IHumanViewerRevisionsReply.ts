import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * The revision worker's answer to one edit batch.
 *
 * @evidence contracts/common.md#principled-implementation Each worker reply pairs domain digests with moved-domain names, graph reach and a nullable computation error.
 * @evidence contracts/common.md#clear-and-simple-design The reply gives the host enough state to publish revisions and update watch reach without shipping source texts back.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed batch carries its cause instead of presenting the prior digest values as a newly successful computation.
 * @evidence contracts/common.md#meaningful-documentation Members define updated digests, moved domains, watcher reach and null as the absence of a computation error.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reply declaration defines transport data, not the graph computation or moved-domain comparison algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Graph reach updates watcher filtering after each batch; actual reuse remains keyed by returned digests and their consumers' document/basis inputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reply arrays and strings contain no worker handles; waiting callers and the revision worker own message retention.
 *
 * @author Samchon
 */
export interface IHumanViewerRevisionsReply {
  /** The digests after the batch. */
  revisions: IHumanViewerRevisions;

  /** The domains whose digest moved. */
  moved: (keyof IHumanViewerRevisions)[];

  /** Every file any graph reaches, so the watcher can ignore the others. */
  reached: string[];

  /** Why the batch could not be computed, or null. */
  error: string | null;
}
