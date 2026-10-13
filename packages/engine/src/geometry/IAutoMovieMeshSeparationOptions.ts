import type { IAutoMovieMeshQueryBudget } from "./IAutoMovieMeshQueryBudget";
import type { IAutoMovieMeshSeparationAttachment } from "./IAutoMovieMeshSeparationAttachment";

/**
 * Per-query inputs of a compiled mesh separation query.
 *
 * `clearance` is the requested separation in the resident mesh's metre frame;
 * zero still requires strict positive separation. `budget` is the caller-owned
 * work count the query spends in place. `attachment` registers a canonical root
 * seat for a three-vertex fan at zero clearance only.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationOptions {
  /**
   * Requested nonnegative separation in metres; zero demands strict positive
   * separation and never accepts touching.
   */
  clearance: number;

  /**
   * Shared mutable work count, spent before each box, triangle and feature test.
   */
  budget: IAutoMovieMeshQueryBudget;

  /**
   * Optional canonical root registration; admitted only at zero clearance for
   * a three-vertex fan.
   */
  attachment?: IAutoMovieMeshSeparationAttachment;
}
