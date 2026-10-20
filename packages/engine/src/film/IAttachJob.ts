import { IAutoMovieActionCall } from "@automovie/interface";

/**
 * One validated `attachTo` job: the coupling and its source action index.
 *
 * `performShot` creates one only after the action's parent is a staged scene
 * node with a rig carrying the named bone; `coupleObjects` then bakes the
 * child's follow clip from it, ordering a child's jobs by `action.start` and,
 * for equal starts, by their creation order, which is ascending `index`.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the narrowed action with its position in the shot's action list, so the coupling stage can stamp handoff events with the authoring index without searching the list again.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the action narrowed to the `attachTo` verb so its parent and bone are typed, and its index; the validation outcome is implied by the record's existence rather than carried as a flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Jobs exist only for actions that passed the parent, rig and bone checks, so the baker's lookups of the parent node and skeleton rely on that validation rather than on a fallback.
 * @evidence contracts/common.md#meaningful-documentation States the producer and the checks that precede a job, the consumer, and how a child's jobs are ordered including ties.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the grouping and ordering of jobs are answered on `coupleObjects`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per `performShot` call from that shot's actions and consumed in the same call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References the caller's action record and holds one number; the job list lives only for the shot compilation.
 */
export interface IAttachJob {
  /** Validated attachment action; the same object as in the shot's actions. */
  action: IAutoMovieActionCall & { verb: "attachTo" };

  /**
   * Position of the action in the shot's `actions` list, stamped on its
   * handoff events as `actionIndex`.
   */
  index: number;
}
