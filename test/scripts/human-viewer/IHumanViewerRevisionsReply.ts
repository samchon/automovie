import type { IHumanViewerRevisions } from "./IHumanViewerRevisions";

/**
 * The revision worker's answer to one edit batch.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
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
