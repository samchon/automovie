import type {
  IAutoMovieRecoveryFeasibleCandidate,
  IAutoMovieRecoveryFeasibleProblem,
  IAutoMovieRecoveryFeasibleTrialSelection,
  IAutoMovieRecoveryFeasibleTrials,
  IAutoMovieRecoverySqpArc,
} from "@automovie/interface";

/**
 * Compare qualified full candidates and one half on the same accelerated arc.
 * Tfull precedes Mfull; only a refused Mfull may request one SOCfull. A
 * qualified accelerated full permits one half, with the same base and
 * correction. Exact cost ties retain the earlier candidate. If every full
 * fails, original tilted halving starts at one half without evaluating its
 * failed full again.
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
  if (
    remaining < 1 ||
    baseline.length < 1 ||
    !(baselineSlope < 0) ||
    (arc !== null && arc.step !== null && !(mixedSlope < 0))
  )
    throw new Error(
      "camera-feasible: bounded actual comparison and descent slopes required",
    );
  const trialWork: number = 128 + 12 * baseline.length;
  charge(256);
  trials.work += 256;
  let used: number = 0,
    qualified: number = 0;
  const best: IAutoMovieRecoveryFeasibleCandidate<State>[] = [];
  const evaluate: (
    step: readonly number[],
    amount: number,
    correction: readonly number[] | null,
    slope: number,
    path: "baseline" | "nominal" | "numerical" | "corrected" | "half",
  ) => IAutoMovieRecoveryFeasibleCandidate<State> = (
    step: readonly number[],
    amount: number,
    correction: readonly number[] | null,
    slope: number,
    path: "baseline" | "nominal" | "numerical" | "corrected" | "half",
  ): IAutoMovieRecoveryFeasibleCandidate<State> => {
    if (used >= remaining)
      throw new Error("camera-feasible: actual comparison horizon exceeded");
    checkpoint();
    charge(trialWork);
    trials.work += trialWork;
    used++;
    trials[path]++;
    const increment: number[] = step.map((value: number, at: number): number =>
      correction === null
        ? amount * value
        : amount * value + amount * amount * correction[at]!,
    );
    const trial: State = problem.retract(state, increment);
    const trialCost: number | null = problem.evaluate(trial);
    const candidate: IAutoMovieRecoveryFeasibleCandidate<State> = {
      state: trial,
      cost: trialCost,
      increment,
      qualified:
        trialCost !== null &&
        trialCost < cost &&
        trialCost <= cost + 1e-4 * amount * slope,
    };
    if (candidate.qualified) {
      qualified++;
      if (best.length === 0 || trialCost! < best[0]!.cost!) best[0] = candidate;
    } else if (trialCost === null || trialCost === Infinity) {
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
      arc.step,
      1,
      null,
      mixedSlope,
      arc.report.numericalMixSupported ? "numerical" : "nominal",
    );
    let acceleratedQualified: boolean = mixed.qualified;
    let correction: number[] | null = null;
    if (!mixed.qualified && used < remaining && arc.correct !== null) {
      const values: number[] | null =
        problem.constraintValues?.(mixed.state, arc.selected) ?? null;
      correction = values === null ? null : arc.correct(values);
      if (values === null) {
        arc.report.correctionAttempted = true;
        arc.report.reason = "trial-constraint-values-unavailable";
      }
      if (correction !== null)
        acceleratedQualified = evaluate(
          arc.step,
          1,
          correction,
          mixedSlope,
          "corrected",
        ).qualified;
    }
    if (acceleratedQualified && used < remaining)
      evaluate(arc.step, 0.5, correction, mixedSlope, "half");
  }
  let amount: number = 0.5;
  let stalled: boolean = false;
  while (best.length === 0 && used < remaining) {
    if (
      amount === 0 ||
      baseline.every((value: number): boolean => amount * value === 0)
    ) {
      stalled = true;
      break;
    }
    evaluate(baseline, amount, null, baselineSlope, "baseline");
    amount *= 0.5;
  }
  const chosen: IAutoMovieRecoveryFeasibleCandidate<State> | null =
    best[0] ?? null;
  trials.qualifiedUnselected += Math.max(0, qualified - 1);
  return {
    state: chosen === null ? state : chosen.state,
    cost: chosen === null ? cost : chosen.cost!,
    accepted: chosen !== null,
    iterations: used,
    stalled,
    increment: chosen?.increment ?? null,
  };
}
