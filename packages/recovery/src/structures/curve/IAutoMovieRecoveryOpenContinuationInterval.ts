import type { IAutoMovieRecoveryOpenCurveGroup } from "./IAutoMovieRecoveryOpenCurveGroup";
import type { IAutoMovieRecoveryOpenCurvePair } from "./IAutoMovieRecoveryOpenCurvePair";

/**
 * Open-curve incidence between two adjacent published section reports.
 *
 * @evidence contracts/common.md#principled-implementation Saved section ordinals select the original coefficient records and local pair ordinals.
 * @evidence contracts/common.md#clear-and-simple-design Admitted pairs and unresolved groups remain separate arrays under the same section interval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural record performs no observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and arrays.
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
