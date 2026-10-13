import type { IHumanViewerRevisions } from "./IHumanViewerRevisions.js";

/**
 * The revision worker's answer to one edit batch.
 *
 * @evidence contracts/common.md#principled-implementation The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
 * @evidence contracts/common.md#clear-and-simple-design One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed computation stays an error and cannot be encoded as a successful moved-domain result.
 * @evidence contracts/common.md#meaningful-documentation Explains the post-batch digests, changed domains, union of reached files and nullable failure reason.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
 * @author Samchon
 */
export interface IHumanViewerRevisionsReply {
  /**
   * The digests after the batch.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The digests after the batch. The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The digests after the batch. One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
   */
  revisions: IHumanViewerRevisions;

  /**
   * The domains whose digest moved.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The domains whose digest moved. The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The domains whose digest moved. One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
   */
  moved: (keyof IHumanViewerRevisions)[];

  /**
   * Every file any graph reaches, so the watcher can ignore the others.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Every file any graph reaches, so the watcher can ignore the others. The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Every file any graph reaches, so the watcher can ignore the others. One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
   */
  reached: string[];

  /**
   * Why the batch could not be computed, or null.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Why the batch could not be computed, or null. The worker reply retains computed digests, moved domains, reached files and a nullable computation error separately.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Why the batch could not be computed, or null. One batch reply supplies both watcher reachability and digest changes without making the watcher compute them.
   */
  error: string | null;
}
