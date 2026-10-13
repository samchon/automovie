import { IAutoMovieSoftBodyState } from "@automovie/interface";
import { IAutoMovieWearableSoftBudget } from "./IAutoMovieWearableSoftBudget";
/**
 * CPU cloth state and admission facts returned by simulateAutoMovieWearableSoftBody.
 *
 * @evidence contracts/common.md#principled-implementation Solved particle state is kept distinct from subject-selection and moving-boundary cost facts, so an admitted budget is not mistaken for proof of cloth stability.
 * @evidence contracts/common.md#clear-and-simple-design State reuses the shared soft-body result while the separate wearable budget adds only live-boundary admission information needed by consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No renderer readiness or visual-fit flag is inferred from CPU completion; state and budget expose only their actual numerical/admission meanings.
 * @evidence contracts/common.md#meaningful-documentation Names the producing API and distinguishes CPU-reference state from the explicit moving-boundary population report.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This wrapper performs no solve; boundary preparation and integration costs belong to its producing functions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One seek result owns its state and budget, while callers decide whether unchanged domain/step inputs justify retaining it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns particle position/velocity arrays and primitive budget facts, with no primary-motion snapshots or host handles retained by the wrapper.
 * @author Samchon
 */
export interface IAutoMovieWearableSoftResult {
  /** Deterministic CPU-reference cloth state. */
  state: IAutoMovieSoftBodyState;

  /** Exact moving-boundary cost facts. */
  budget: IAutoMovieWearableSoftBudget;
}
