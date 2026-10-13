import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";
import type { IHumanViewerWarmLastFailure } from "./IHumanViewerWarmLastFailure.js";

/**
 * Progress of the current background warm pass, as `/health` reports it.
 *
 * @evidence contracts/common.md#principled-implementation Warm progress ties total, successful draws, skipped failures and current document to one pass revision.
 * @evidence contracts/common.md#clear-and-simple-design Current-pass counters and the cross-pass last failure coexist in one health record with distinct lifetimes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skipped documents retain explicit reasons and do not contribute to the successful draw counter.
 * @evidence contracts/common.md#meaningful-documentation Explains warm revision, total/done/skipped counts, nullable current document and retained latest failure.
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
