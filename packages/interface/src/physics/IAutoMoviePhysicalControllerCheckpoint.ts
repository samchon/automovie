import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalHandoff } from "./IAutoMoviePhysicalHandoff";
import type { IAutoMoviePhysicalTargetInterval } from "./IAutoMoviePhysicalTargetInterval";

/**
 * Engine controller state captured at one completed fixed step alongside the
 * separate native-world snapshot.
 *
 * `AutoMovieEnginePhysicalSimulation.run` constructs this record from its contact
 * ledger and fitted target plans. Restoring a checkpoint clones it after
 * `checkpointPhysicalSimulation` establishes an unchanged sampled-input prefix
 * and matching cache protocol. It contains no solver handles, callbacks or
 * native object layouts. A structurally valid record alone does not establish
 * input equivalence or authorize resuming an arbitrary world snapshot.
 */
export interface IAutoMoviePhysicalControllerCheckpoint {
  /**
   * Number of contact episodes in the cache prefix; restoration copies only
   * entries before this index.
   */
  contactCount: number;

  /**
   * Active episodes retain metadata and their completed sample prefix, so later
   * samples cannot leak into a resumed run.
   */
  episodes: {
    /**
     * Detached episode metadata at capture; sample arrays remain in the cache's
     * contact ledger.
     */
    receipt: Omit<IAutoMovieContactReceipt, "samples">;

    /** Number of completed samples belonging to this episode at the checkpoint. */
    sampleCount: number;
  }[];

  /**
   * Ordered contact-pair lookup entries `[pair key, receipt id]` used to
   * reconnect active episodes to the restored ledger.
   */
  active: [string, string][];

  /**
   * Ordered `[body/bone key, release-end seconds]` entries for temporarily
   * softened tracking; seconds use the simulation-local clock.
   */
  softened: [string, number][];

  /**
   * Bodies whose tracking was released before capture; absent restores an empty
   * release set.
   */
  released?: string[];

  /**
   * Bodies activated by contact before capture; absent restores an empty
   * contact-release set.
   */
  contactReleased?: string[];

  /**
   * Recovery target plans by body, detached from mutable binding maps; absent
   * restores no previously fitted recovery plan.
   */
  balanceTargets?: Record<
    string,
    IAutoMoviePhysicalTargetInterval.IPlan & {
      /** Downward root displacement fitted at the interval end, metres. */
      rootDrop: number;

      /**
       * Remaining support-goal distances by bone, metres, from the fitted
       * recovery target.
       */
      residuals: Record<string, number>;

      /** Root displacement at the preserved start of this interval, metres. */
      fromRootDrop: number;
    }
  >;

  /**
   * Actual-root floor-support target plans by body; absent restores no retained
   * support interval.
   */
  supportTargets?: Record<string, IAutoMoviePhysicalTargetInterval.IPlan>;

  /**
   * Contact-fitting target plans by body; absent restores no retained contact
   * interval.
   */
  contactTargets?: Record<string, IAutoMoviePhysicalTargetInterval.IPlan>;

  /** Causal handoff state by body then bone; absent restores no handoffs. */
  handoffs?: Record<string, Record<string, IAutoMoviePhysicalHandoff>>;

  /**
   * Number of completed native-ownership changes in the cache ledger; absence
   * retains zero entries on restoration.
   */
  ownershipCount?: number;
}
