import type {
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "@automovie/interface";

import { RecoveryChartFitPrepare } from "./RecoveryChartFitPrepare";
import { RecoveryChartFitReport } from "./RecoveryChartFitReport";
import { RecoveryChartFitSolve } from "./RecoveryChartFitSolve";
import { RecoveryChartFitSystem } from "./RecoveryChartFitSystem";

/**
 * Joint Bernstein fitting with fixed shared coefficients and explicit box constraints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Records physical units, numerical termination and the distinction between observation residual and surface fidelity.
 * @evidence contracts/development/design.md#principled-representation Shared millimetre coefficient IDs, explicit affine dependencies and a componentwise enclosure define one constrained Bernstein least-squares problem.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The runtime namespace coordinates preparation, sparse assembly, solve and reporting over IAutoMovieRecoveryChartFit's canonical records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical rank, gradient termination and finite observation residual are independent qualifications; none certifies embedding or continuous source fidelity.
 */
export namespace RecoveryChartFit {
  /**
   * Solve one constrained chart with assembled shared-control normal equations.
   * A positive diagonal congruence scales the original symmetric Gram problem and
   * its feasible box. The original projected-gradient mapping, not a transformed
   * residual, determines numerical termination. Each accelerated step
   * projects unknown coefficients onto the declared box; objective increase
   * restarts momentum. No geometry is sampled or tessellated here.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Position and physical-gradient rows share exact affine coefficient identities; diagonal congruence preserves the declared least-squares objective and box, while termination evaluates the original projected-gradient mapping. Pivoted Cholesky reports numerical observation rank independently of residual and convergence; the enclosure does not create observational information.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sparse normal-equation assembly removes observation-count work from each iteration; final residuals still evaluate the original correspondences.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No regularizer, enclosure relaxation, coefficient clipping after solving, hidden smoothing or source mesh fallback changes the declared problem.
   * @evidence contracts/development/common.md#meaningful-documentation Numerical Gram rank uses a declared machine-scale pivot tolerance, not exact rank or a singular-value certificate; embedding and continuous source distance remain unproved.
   * @evidence contracts/development/implementation.md#efficient-algorithms For N observations and reduced stencil width W, assembly costs O(N*W squared), with W at most 16 for identity-only controls or the explicit affine row cap (128 by default). I iterations cost O(I(H+M)); storage is O(H+M) plus bounded substitution expressions. Rank diagnostics use O(M squared) memory only up to 512 unknown controls and direct QR has a separate 50000000 scalar-projection budget; unavailable diagnostics retain an unqualified finite candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed contributions, normalized weights, sparse Hessian, right-hand sides and row-sum spectral bound are assembled once and reused by every gradient iteration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Observation arrays remain caller-owned; sparse normal equations and the bounded dense rank workspace expire on return, while coefficients, scalar diagnostics and one bounded private witness return to the caller. The public observer removes that witness into a separate private sidecar.
   */
  export function fit(
    input: IAutoMovieRecoveryChartFit.Input,
  ): IAutoMovieRecoveryChartFit.Result {
    const prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> =
      RecoveryChartFitPrepare(input);
    const system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation> =
      RecoveryChartFitSystem(input, prepared);
    const solution: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation> =
      RecoveryChartFitSolve(input, prepared, system);
    return RecoveryChartFitReport(input, prepared, system, solution);
  }
}
