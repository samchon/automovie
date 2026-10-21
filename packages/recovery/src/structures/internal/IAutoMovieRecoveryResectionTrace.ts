import type { refineRecoveryResection } from "../../internal/refineRecoveryResection";
import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryResectionDesignTrace } from "./IAutoMovieRecoveryResectionDesignTrace";
import type { IAutoMovieRecoveryResectionScore } from "./IAutoMovieRecoveryResectionScore";

/**
 * Synchronous diagnostic evidence from the unchanged robust resection path.
 * Each event is an owned snapshot, so observer mutation cannot alter the fit.
 * The observer accounts for any retained history; observer errors propagate.
 *
 * @evidence contracts/common.md#principled-implementation One event follows each actual proposal or final refit, including numerical refusal and nonconvergence. Before/after scores use the same fixed population and unchanged acceptance gates.
 * @evidence contracts/common.md#clear-and-simple-design Optional observation stays separate from proposal selection; absent observers allocate no design trace and retain no event history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No diagnostic pose or local result registers a camera, modifies input observations or bypasses support stability. Events fire outside numerical catches.
 * @evidence contracts/common.md#meaningful-documentation States phase-local indices, copied ownership, missing results, observer error propagation and conditional fitted-support meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased event performs no scoring or fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Events copy already computed poses, scores and refinement reports without a second fit or score.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer retains no history; the optional observer owns retained copies and external writes.
 */
export interface IAutoMovieRecoveryResectionTrace {
  /** Proposal draw or final fixed-subset refit. */
  phase: "proposal" | "final-refit";

  /** Zero-based draw number or zero-based final-refit number. */
  index: number;

  /** Copied six sampled indices, or complete input support of a final refit. */
  sample: readonly number[];

  /** Partial initializer evidence, absent for a final refit. */
  design: IAutoMovieRecoveryResectionDesignTrace | null;

  /** Declared numerical refusal text; an unexpected error instead propagates. */
  error: string | null;

  /** Qualified initializer or current best pose before optional refinement. */
  beforePose: IAutoMovieRecoveryMapPose | null;

  /** Same-population score before refinement, absent after initialization failure. */
  before: IAutoMovieRecoveryResectionScore | null;

  /** Whether this event actually entered the fixed-subset nonlinear solver. */
  refinementAttempted: boolean;

  /** Actual local report, including nonconvergence; absent if unattempted or thrown. */
  refinement: ReturnType<typeof refineRecoveryResection> | null;

  /** Proposal retained by local comparison, or converged final-refit pose. */
  afterPose: IAutoMovieRecoveryMapPose | null;

  /** Same-population score used after refinement; absent for a failed final refit. */
  after: IAutoMovieRecoveryResectionScore | null;

  /** Exact final-refit membership equality; null for proposals or failed refits. */
  stable: boolean | null;
}
