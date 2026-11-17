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
 * @evidence contracts/development/design.md#principled-representation The query turns zero clearance into the smallest positive binary64 target, so strict separation is demanded without a spatial tolerance, and it admits the budget and attachment before visiting any box.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The target, the work bound and the optional seat travel together because one hair row needs all three per call, while the resident snapshot stays in the compiled query and is never repeated here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Touching is never accepted by a zero target and an attachment at positive clearance is refused rather than ignored, so no option quietly weakens the proof a caller asked for.
 * @evidence contracts/development/common.md#meaningful-documentation States the unit and frame of the clearance, what zero means, who owns the budget, when an attachment is admitted, and every refusal.
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
