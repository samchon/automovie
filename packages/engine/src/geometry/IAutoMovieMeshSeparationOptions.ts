import type { IAutoMovieMeshQueryBudget } from "./IAutoMovieMeshQueryBudget";
import type { IAutoMovieMeshSeparationAttachment } from "./IAutoMovieMeshSeparationAttachment";

/**
 * Per-query inputs of a compiled mesh separation query.
 *
 * `clearance` is the requested separation in the resident mesh's metre frame;
 * zero still requires strict positive separation. `budget` is the caller-owned
 * work count the query spends in place. `attachment` registers a canonical root
 * seat and is admitted only for a three-vertex fan at zero clearance. The query
 * throws on a missing, negative or non-finite clearance, a malformed budget, or
 * an attachment outside those conditions.
 *
 * @evidence contracts/common.md#principled-implementation The query turns zero clearance into the smallest positive binary64 target, so strict separation is demanded without a spatial tolerance, and it admits the budget and attachment before visiting any box.
 * @evidence contracts/common.md#clear-and-simple-design The target, the work bound and the optional seat travel together because one hair row needs all three per call, while the resident snapshot stays in the compiled query and is never repeated here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Touching is never accepted by a zero target and an attachment at positive clearance is refused rather than ignored, so no option quietly weakens the proof a caller asked for.
 * @evidence contracts/common.md#meaningful-documentation States the unit and frame of the clearance, what zero means, who owns the budget, when an attachment is admitted, and every refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An options record; how clearance and attachment change the walk is answered on the separation query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per call by hair fitting; verdict reuse keyed on clearance and attachment presence is the ribbon fit's own cache, not this record's.
 * @evidence contracts/performance.md#bound-retention-and-release-resources References the caller's budget and attachment, mutating only the budget's count; the query keeps no reference after it returns.
 */
export interface IAutoMovieMeshSeparationOptions {
  /**
   * Requested nonnegative finite separation in metres; zero demands strict
   * positive separation and never accepts touching.
   */
  clearance: number;

  /**
   * Shared mutable work count, spent before each box, triangle and feature
   * test.
   */
  budget: IAutoMovieMeshQueryBudget;

  /**
   * Canonical root registration of the feature's first vertex; omitted means
   * every resident triangle needs strict separation. Admitted only at zero
   * clearance for a three-vertex fan.
   */
  attachment?: IAutoMovieMeshSeparationAttachment;
}
