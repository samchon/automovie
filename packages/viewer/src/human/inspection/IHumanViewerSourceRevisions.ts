import type { IHumanViewerMovedDomains } from "./IHumanViewerMovedDomains.js";

/**
 * The revision owner as source watching uses it.
 *
 * @evidence contracts/common.md#principled-implementation Reached-file membership and off-request changed-domain computation use the same revision owner.
 * @evidence contracts/common.md#clear-and-simple-design The watcher borrows two revision operations without maintaining another import graph or digest cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Files are admitted by actual source reachability rather than fixture or document names.
 * @evidence contracts/common.md#meaningful-documentation Defines the reached-file query and the asynchronous computation of domains moved by an edit batch.
 * @author Samchon
 */
export interface IHumanViewerSourceRevisions {
  /**
   * Whether a file is reached by any domain's import graph.
   *
   * @evidence contracts/common.md#principled-implementation Membership asks whether a file is present in any actual revision import graph.
   * @evidence contracts/common.md#clear-and-simple-design The watcher borrows the revision owner's reachability result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A subject name or directory heuristic is not substituted for graph reachability.
   * @evidence contracts/common.md#meaningful-documentation Documents the reached-file query used to admit source edits.
   */
  reaches: (file: string) => boolean;

  /**
   * Record changed files and name the revision domains they moved, computed off the request thread.
   *
   * @evidence contracts/common.md#principled-implementation An edit batch is recorded and its affected domains are computed off the request thread.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous operation retains revision and graph authority behind the source owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed domains reflect computed digest movement rather than automatic invalidation of every domain.
   * @evidence contracts/common.md#meaningful-documentation Defines the input file batch and returned moved-domain result.
   */
  changed: (files: string[]) => Promise<IHumanViewerMovedDomains>;
}
