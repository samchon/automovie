import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";
import type { IHumanViewerWarmLastFailure } from "./IHumanViewerWarmLastFailure.js";

/**
 * Progress of the current background warm pass, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation Warm progress separates total documents, successful/already-cached completions and capture failures under a named source generation.
 * @evidence contracts/common.md#clear-and-simple-design One health record exposes pass counters, active document and retained latest failure without owning queue admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skipped captures retain per-document reasons instead of contributing to the done count or hiding refusal under warming progress.
 * @evidence contracts/common.md#meaningful-documentation Comments define counters, null active document between work, and latest failure retention across new-pass resets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The warming status declaration chooses no document filtering or low-priority queue scheduling algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Already-cached documents count as done only through the host's thumbnail-key policy; revision mismatch withdraws obsolete warm work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The current pass holds at most one failure record per attempted document and one latest historical failure; counters reset for each new pass.
 *
 * @author Samchon
 */
export interface IHumanViewerWarming {
  /** Source generation the pass warms. */
  revision: string;

  /** Published documents the pass covers. */
  total: number;

  /** Documents already drawn, including those found warm. */
  done: number;

  /** Documents whose capture failed. */
  skipped: number;

  /** Why each skipped document failed. */
  failures: IHumanViewerWarmFailure[];

  /** Document being warmed, or null between documents. */
  current: string | null;

  /**
   * The latest failure of any pass, kept when a new pass resets the counters; null before the first.
   */
  lastFailure: IHumanViewerWarmLastFailure | null;
}
