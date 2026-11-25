import type { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";

/**
 * One validated `attachTo` job: the coupling and its source action index.
 *
 * `performShot` creates one only after the action's parent is a staged scene
 * node with a rig carrying the named bone and the supplied offset has a finite
 * position and unit rotation. `coupleObjects` then bakes the child's follow
 * clip from it, ordering a child's jobs by `action.start` and, for equal
 * starts, by their creation order, which is ascending `index`.
 */
export interface IAutoMovieAttachJob {
  /** Validated attachment action; the same object as in the shot's actions. */
  action: IAutoMovieActionCall & {
    /**
     * Attachment discriminant retained after action admission; the remaining
     * fields are the attachTo branch of IAutoMovieActionCall.
     */
    verb: "attachTo";
  };

  /**
   * Position of the action in the shot's `actions` list, stamped on its handoff
   * events as `actionIndex`.
   */
  index: number;
}
