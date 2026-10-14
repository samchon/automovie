import type { createHumanViewerCompileGate } from "./createHumanViewerCompileGate.js";

/**
 * What the generation windows read and hold.
 *
 * @evidence contracts/common.md#principled-implementation A candidate window borrows the compile gate and live source facts so closure can label loaded code only when no reached edit dirtied the window.
 * @evidence contracts/common.md#clear-and-simple-design Groups the gate with revision/updating readings and a closure notification, leaving token/history bookkeeping to the window owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dirty or still-updating candidates close with null authority; independent release/notification attempts preserve failures instead of inventing a current label.
 * @evidence contracts/common.md#meaningful-documentation States that closing resumes compile withdrawal and notifies pending document admission; active holds are distinct from retained closed labels.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The props record performs no work; token maps provide lookups, edits traverse open windows and closed history is capped at 64.
 * @evidence contracts/performance.md#reuse-equivalent-work Window readers share one closure promise per token; revision is compared with current source rather than reused across dirty windows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Active windows have no numeric cap and hold compilation until close/closeAll; their owner releases holds and keeps only the latest 64 closed labels.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerGenerationWindowsProps {
  /** The compile gate a window holds. */
  gate: ReturnType<typeof createHumanViewerCompileGate>;

  /**
   * The current source revision.
   *
   * @evidence contracts/common.md#principled-implementation Reads the current source revision when a clean non-updating window closes and when current-token authority is queried.
   * @evidence contracts/common.md#clear-and-simple-design Leaves source digest computation with the existing source reader rather than hashing code in each window.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A current string alone cannot certify a dirty candidate; the owner also checks reached edits and updating state before labeling.
   * @evidence contracts/common.md#meaningful-documentation The callback must report live source authority; window labels remain the loaded candidate's revision rather than an intent to update it.
   * @evidence contracts/performance.md#efficient-algorithms Window lookups/comparisons are constant-count operations over revision text; source digest maintenance cost belongs to its owner.
   * @evidence contracts/performance.md#reuse-equivalent-work The source owner maintains its digest, while windows refresh the reading at close/current checks after invalidation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a string and acquires no source watcher; watcher and compile-gate lifetime remain host-owned.
   */
  revision: () => string;

  /**
   * Whether an edit batch is still being digested.
   *
   * @evidence contracts/common.md#principled-implementation Reports whether a source edit batch is still being digested when window closure considers a revision label.
   * @evidence contracts/common.md#clear-and-simple-design Keeps transient source-publication state beside revision authority without a timer-derived readiness guess.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A true result prevents a current label even when no window edit flag was set; closure returns null instead of trusting unsettled source.
   * @evidence contracts/common.md#meaningful-documentation The value is read at close, and false is only one premise alongside a clean window and its actual loaded-code protocol.
   * @evidence contracts/performance.md#efficient-algorithms One boolean reading per closing window adds no filesystem traversal; batching work belongs to the source owner.
   * @evidence contracts/performance.md#reuse-equivalent-work The callback reads current batch state rather than a cached open-time value because edits can arrive during candidate loading.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no timer or task through this signature; the source owner owns outstanding batch settlement.
   */
  updating: () => boolean;

  /**
   * Told after a window closed, so documents waiting on its frame are asked again.
   *
   * @evidence contracts/common.md#principled-implementation Notifies the host after window closure so document admissions waiting for that frame can be explicitly retried.
   * @evidence contracts/common.md#clear-and-simple-design Keeps retry triggers outside source-label bookkeeping and uses the existing host notification boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Notification is attempted independently of hold release and label settlement; its failure is preserved rather than leaving the label promise pending.
   * @evidence contracts/common.md#meaningful-documentation Both ordinary and bulk closure notify through this callback, while unknown ordinary tokens are ignored by the owner.
   * @evidence contracts/performance.md#efficient-algorithms One notification follows ordinary closure and one follows a bulk close snapshot; subsequent catalogue/admission work has its own input-sized cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Retry reuses current keyed verdicts and only reasks waiting state; closure notification itself is an effect and is not memoized by label equality.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback reference lives with the windows service; label promises are settled and compile holds released independently before collected window state can retire.
   */
  closed: () => void;
}
