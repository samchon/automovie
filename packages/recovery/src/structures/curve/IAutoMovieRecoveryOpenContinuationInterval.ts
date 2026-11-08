import type { IAutoMovieRecoveryOpenCurveGroup } from "./IAutoMovieRecoveryOpenCurveGroup";
import type { IAutoMovieRecoveryOpenCurvePair } from "./IAutoMovieRecoveryOpenCurvePair";

/**
 * Open-curve incidence between two adjacent published section reports.
 *
 * @evidence contracts/development/design.md#principled-representation Saved section ordinals select the original coefficient records and local pair ordinals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Admitted pairs and unresolved groups remain separate arrays under the same section interval.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 */
export interface IAutoMovieRecoveryOpenContinuationInterval {
  /** Preceding section ordinal in the saved publication. */
  beforeSection: number;

  /** Following adjacent section ordinal in the saved publication. */
  afterSection: number;

  /** Qualified ordinary open-curve pairs using local curve ordinals. */
  pairs: IAutoMovieRecoveryOpenCurvePair[];

  /** Unsupported or unrepresented curve components. */
  unresolved: IAutoMovieRecoveryOpenCurveGroup[];
}
