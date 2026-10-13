import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * The revision worker's answer to one edit batch.
 *
 * @evidence contracts/common.md#principled-implementation The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
 * @evidence contracts/common.md#clear-and-simple-design One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed computation stays an error and cannot be encoded as a successful moved-domain result.
 * @evidence contracts/common.md#meaningful-documentation Explains the post-batch digests, changed domains, union of reached files and nullable failure reason.
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
