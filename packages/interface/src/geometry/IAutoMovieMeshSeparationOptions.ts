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
