import type { IAutoMovieMeshQueryBudget } from "./IAutoMovieMeshQueryBudget";
import type { IAutoMovieMeshSeparationAttachment } from "./IAutoMovieMeshSeparationAttachment";

/**
 * Required clearance and caller-owned budget with optional registration for a
 * touching fan root.
 */
export interface IAutoMovieMeshSeparationOptions {
  /**
   * Nonnegative finite separation target in resident-frame metres. At zero, any
   * proved positive separation suffices away from admitted attachment
   * supports.
   */
  clearance: number;

  /**
   * Mutable shared work budget spent in place by this query. Exhaustion throws
   * when more work is needed.
   *
   * A zero counter is admitted. The next attempted spend throws. A later proof
   * or attachment validation failure can occur after work has already been
   * charged.
   */
  budget: IAutoMovieMeshQueryBudget;

  /**
   * Optional root seat and support metadata for a three-vertex fan at zero
   * requested clearance. Omission applies strict separation to every resident
   * triangle.
   */
  attachment?: IAutoMovieMeshSeparationAttachment;
}
