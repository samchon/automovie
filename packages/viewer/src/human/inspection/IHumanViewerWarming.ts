import type { IHumanViewerWarmFailure } from "./IHumanViewerWarmFailure.js";
import type { IHumanViewerWarmLastFailure } from "./IHumanViewerWarmLastFailure.js";

/**
 * Progress of the current background warm pass, as `/health` reports it.
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
