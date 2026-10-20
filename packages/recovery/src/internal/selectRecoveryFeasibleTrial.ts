import type { IAutoMovieRecoveryFeasibleCandidate } from "../structures/internal/IAutoMovieRecoveryFeasibleCandidate";
import type { IAutoMovieRecoveryFeasibleProblem } from "../structures/internal/IAutoMovieRecoveryFeasibleProblem";
import type { IAutoMovieRecoveryFeasibleTrials } from "../structures/internal/IAutoMovieRecoveryFeasibleTrials";
import type { IAutoMovieRecoveryFeasibleTrialSelection } from "../structures/internal/IAutoMovieRecoveryFeasibleTrialSelection";
import type { IAutoMovieRecoverySqpArc } from "../structures/internal/IAutoMovieRecoverySqpArc";

/**
 * Compare qualified full candidates and one half on the same accelerated arc.
 * Tfull precedes Mfull; only a refused Mfull may request one SOCfull. A qualified
 * accelerated full permits one half, with the same base and correction. Exact
 * cost ties retain the earlier candidate. If every full fails, original tilted
 * halving starts at one half without evaluating its failed full again.
 *
 * @evidence contracts/common.md#principled-implementation Same-base actual objective ordering selects only candidates passing every nonlinear gate, strict finite decrease and their own Armijo condition. Corrected full/half use the mixed path's derivative at zero and t*p+t^2*delta. A qualified baseline full bounds the selected cost, not its KKT progress or finite-trial rate.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates a bounded comparison and original baseline backtracking; problem callbacks own geometry, and the fit owner independently checks original normal KKT after a commit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cost tie tolerance, failed-row deletion, repeated full trial, hidden exception, successful initial-state fallback or extra trial allowance supplies a result. Unsupported correction is candidate absence; unexpected callbacks and charge errors propagate even after a valid baseline was found.
 * @evidence contracts/common.md#meaningful-documentation Comparison has at most four evaluations, while all-full-failure baseline halving can use more within the passed remaining horizon. Qualified unselected candidates consume actual work and trials; only one selected state commits.
 * @evidence contracts/performance.md#efficient-algorithms At most remaining actual evaluations use O(n) increment construction plus owner geometry work. Fixed selection/attribution reserves256 visits per model and128+12*n per actual evaluation before execution; actual retraction, all gates, selected measurements and the single correction retain their separate owner charges.
 * @evidence contracts/performance.md#reuse-equivalent-work Every comparison uses the same base, directions, metric and at most one correction. Half uses the existing corrected arc without a new factor, model or correction; baseline backtracking reuses its original direction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller admits current/base/checkpoint ownership plus at most four detached candidate states alongside current factors, rows and step vectors. Best/failed/current roles alias these slots; only the selected state returns, without candidate history.
 */
export function selectRecoveryFeasibleTrial<State>(
  problem: IAutoMovieRecoveryFeasibleProblem<State>,
  state: State,
  cost: number,
  baseline: readonly number[],
  baselineSlope: number,
  arc: IAutoMovieRecoverySqpArc | null,
  mixedSlope: number,
  remaining: number,
  trials: IAutoMovieRecoveryFeasibleTrials,
  checkpoint: () => void,
  charge: (work: number) => void,
): IAutoMovieRecoveryFeasibleTrialSelection<State> {
  if (!Number.isSafeInteger(remaining) || remaining < 1 || baseline.length < 1 || !Number.isFinite(cost) ||
      !(baselineSlope < 0) || !Number.isFinite(baselineSlope) ||
      (arc !== null && arc.step !== null && (!(mixedSlope < 0) || !Number.isFinite(mixedSlope))))
    throw new Error("camera-feasible: bounded actual comparison and descent slopes required");
  const trialWork: number = 128 + 12 * baseline.length;
  if (!Number.isSafeInteger(trialWork)) throw new Error("camera-feasible: bounded trial-vector work required");
  charge(256);
  trials.work += 256;
  let used: number = 0, qualified: number = 0;
  const best: IAutoMovieRecoveryFeasibleCandidate<State>[] = [];
  const evaluate: (
    step: readonly number[], amount: number, correction: readonly number[] | null,
    slope: number, path: "baseline" | "nominal" | "numerical" | "corrected" | "half",
  ) => IAutoMovieRecoveryFeasibleCandidate<State> = (
    step: readonly number[], amount: number, correction: readonly number[] | null,
    slope: number, path: "baseline" | "nominal" | "numerical" | "corrected" | "half",
  ): IAutoMovieRecoveryFeasibleCandidate<State> => {
    if (used >= remaining) throw new Error("camera-feasible: actual comparison horizon exceeded");
    checkpoint();
    charge(trialWork);
    trials.work += trialWork;
    used++;
    trials[path]++;
    const trial: State = problem.retract(state, step.map(
      (value: number, at: number): number => correction === null ? amount * value :
        amount * value + amount * amount * correction[at]!,
    ));
    const trialCost: number | null = problem.evaluate(trial);
    const candidate: IAutoMovieRecoveryFeasibleCandidate<State> = {
      state: trial, cost: trialCost,
      qualified: trialCost !== null && Number.isFinite(trialCost) && trialCost < cost &&
        trialCost <= cost + 1e-4 * amount * slope,
    };
    if (candidate.qualified) {
      qualified++;
      if (best.length === 0 || trialCost! < best[0]!.cost!) best[0] = candidate;
    } else if (trialCost === null || !Number.isFinite(trialCost)) {
      trials.infeasible++;
      trials.lastFailure = "actual-qualification";
    } else if (trialCost >= cost) {
      trials.nondecreasing++;
      trials.lastFailure = "nondecreasing-cost";
    } else {
      trials.armijo++;
      trials.lastFailure = "armijo";
    }
    return candidate;
  };
  evaluate(baseline, 1, null, baselineSlope, "baseline");
  if (used < remaining && arc !== null && arc.step !== null) {
    const mixed: IAutoMovieRecoveryFeasibleCandidate<State> = evaluate(
      arc.step, 1, null, mixedSlope, arc.report.numericalMixSupported ? "numerical" : "nominal",
    );
    let acceleratedQualified: boolean = mixed.qualified;
    let correction: number[] | null = null;
    if (!mixed.qualified && used < remaining && arc.correct !== null) {
      const values: number[] | null = problem.constraintValues?.(mixed.state, arc.selected) ?? null;
      correction = values === null ? null : arc.correct(values);
      if (values === null) {
        arc.report.correctionAttempted = true;
        arc.report.reason = "trial-constraint-values-unavailable";
      }
      if (correction !== null)
        acceleratedQualified = evaluate(arc.step, 1, correction, mixedSlope, "corrected").qualified;
    }
    if (acceleratedQualified && used < remaining)
      evaluate(arc.step, 0.5, correction, mixedSlope, "half");
  }
  let amount: number = 0.5;
  let stalled: boolean = false;
  while (best.length === 0 && used < remaining) {
    if (amount === 0 || baseline.every((value: number): boolean => amount * value === 0)) {
      stalled = true;
      break;
    }
    evaluate(baseline, amount, null, baselineSlope, "baseline");
    amount *= 0.5;
  }
  const chosen: IAutoMovieRecoveryFeasibleCandidate<State> | null = best[0] ?? null;
  trials.qualifiedUnselected += Math.max(0, qualified - 1);
  return {
    state: chosen === null ? state : chosen.state,
    cost: chosen === null ? cost : chosen.cost!,
    accepted: chosen !== null, iterations: used, stalled,
  };
}
