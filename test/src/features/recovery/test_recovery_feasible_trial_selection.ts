import { TestValidator } from "@nestia/e2e";

import { selectRecoveryFeasibleTrial } from "../../../../packages/recovery/src/internal/selectRecoveryFeasibleTrial";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";
import type { IAutoMovieRecoveryFeasibleTrials } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleTrials";
import type { IAutoMovieRecoveryFeasibleTrialSelection } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleTrialSelection";
import type { IAutoMovieRecoverySqpArc } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoverySqpArc";
import type { IRecoveryFeasibleTrialObservation } from "../internal/IRecoveryFeasibleTrialObservation";
import { nclose } from "../internal/nclose";

/**
 * Same-base candidate selection preserves actual gates, ordering and trial work.
 *
 * Scenarios:
 * 1. Independent quadratics distinguish full overshoot, a better full, exact ties, a cheaper gate failure, and a cheaper candidate failing its own Armijo test.
 * 2. A failed mixed full permits one correction; the same arc half uses .5*p+.25*delta and the original mixed slope. A failed half retains its qualified full.
 * 3. Remaining1/2/3/4 follows T/M/conditional correction/half prefixes; all-full failure continues original baseline halving and can consume five actual trials in one model.
 * 4. Qualified unselected candidates are neither accepted commits nor failures. Unexpected core errors propagate even after a qualified baseline is retained.
 * 5. A two-variable quadratic has a cheaper qualified full mixture with a larger tangent gradient than baseline, limiting cost protection to its actual objective ordering.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained actual-trial selector with authored detached scalar retractions and original objective/gate callbacks. Observes every evaluated state, one chosen state, path/outcome counters, checkpoints and charges without fitting or replacing a foreign function.
 * @evidence contracts/testing.md#independent-expectations For F=.75*x^2 at1 with p=-1.5, full cost3/16 exceeds half3/64; F=.5*x^2 with p=-1 instead favors full0. For F=x^2,p=-2,delta=.5, corrected full=-.5 and half=.125. Explicit polynomial Armijo and gate cases determine exclusions. For F=.5*(u-1)^2+.75*v^2 with u<=0, the free gradient1.5*v independently distinguishes actual cost ordering from tangent stationarity.
 * @evidence contracts/testing.md#distinguishing-cases Covers exact tie ordering, both accelerated branches, half gate/Armijo failure, core measurement/retraction/evaluation/checkpoint/charge errors, horizon prefixes, qualified-unselected partition and five-trial baseline fallback. End-to-end nonlinear/rate/metric tests separately own direction generation and original KKT convergence.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_trial_selection entry uses resident authored scalar problems and the source selector, without files, processes, compiler, images, installation, browser or GPU.
 */
export function test_recovery_feasible_trial_selection(): void {
  const marker: Error = new Error("actual-candidate-core");
  const run: (
    baseline: number, mixed: number | null, correction: number | null,
    remaining: number, mode?: string, scale?: number,
  ) => IRecoveryFeasibleTrialObservation = (
    baseline: number, mixed: number | null, correction: number | null,
    remaining: number, mode: string = "ordinary", scale: number = 1,
  ): IRecoveryFeasibleTrialObservation => {
    const states: number[] = [];
    let checkpoints: number = 0, work: number = 0, corrections: number = 0, retractions: number = 0;
    const trials: IAutoMovieRecoveryFeasibleTrials = {
      baseline: 0, nominal: 0, numerical: 0, corrected: 0, half: 0, qualifiedUnselected: 0,
      infeasible: 0, nondecreasing: 0, armijo: 0, lastFailure: null, work: 0,
    };
    const costAt: (x: number) => number = (x: number): number => scale * x * x +
      (mode === "half-armijo" ? ((15 / 16 - 1e-4) * 256 / 81) * (x - 1) ** 2 * (x + 0.5) ** 2 : 0);
    const problem: IAutoMovieRecoveryFeasibleProblem<number> = {
      initial: 1,
      evaluate: (x: number): number | null => {
        states.push(x);
        if (mode === "evaluate-throw" && states.length === 2) throw marker;
        if (mode === "nonfinite" && x < 0) return Number.NaN;
        if ((mode === "negative-gate" && x < 0) ||
            (mode === "half-gate" && x > 0.5 && x < 0.75)) return null;
        return costAt(x);
      },
      linearize: (): never => { throw new Error("selector must reuse the caller's current model"); },
      retract: (x: number, step: readonly number[]): number => {
        retractions++;
        if (mode === "retract-throw" && retractions === 2) throw marker;
        return x + step[0]!;
      },
      constraintValues: (): number[] | null => {
        if (mode === "measure-throw") throw marker;
        return mode === "unsupported" ? null : [0];
      },
    };
    const arc: IAutoMovieRecoverySqpArc | null = mixed === null ? null : {
      step: [mixed], sqpStep: null, multipliers: [], selected: [1],
      correct: correction === null ? null : (): number[] => {
        if (++corrections > 1) throw new Error("one curvature action per model required");
        return [correction!];
      },
      report: {
        qualified: true, reason: "authored-selection-only", selectedRows: 1, coordinates: 1,
        designRatio: 1, maximumViolation: 0, equalityResidual: 0, stationarityResidual: 0,
        stationarityScale: 1, mixWeight: 0.5, equalityBeforeRefinement: 0,
        refinementAttempted: false, nominalMixWeight: 0.5, numericalMixAttempted: false,
        numericalMixSupported: false, correctionAttempted: false, correctionSupported: false, work: 0,
      },
    };
    const selected: IAutoMovieRecoveryFeasibleTrialSelection<number> = selectRecoveryFeasibleTrial(
      problem, 1, costAt(1), [baseline], 2 * scale * baseline, arc,
      mixed === null ? 0 : 2 * scale * mixed, remaining, trials,
      (): void => { if (++checkpoints === 2 && mode === "checkpoint-throw") throw marker; },
      (amount: number): void => {
        if (mode === "charge-throw" && work > 256) throw marker;
        work += amount;
      },
    );
    return { selected, trials, states, checkpoints, work, corrections };
  };
  const observations: IRecoveryFeasibleTrialObservation[] = [];
  const checks: boolean[] = [];
  for (let remaining: number = 1; remaining <= 4; remaining++) {
    const row: IRecoveryFeasibleTrialObservation = run(-0.5, -2, 0.5, remaining);
    observations.push(row);
    checks.push(row.selected.accepted && row.selected.iterations === remaining &&
      row.selected.state === (remaining < 4 ? 0.5 : 0.125) &&
      row.corrections === (remaining < 3 ? 0 : 1) &&
      row.trials.qualifiedUnselected === Math.max(0, remaining - 2) &&
      row.trials.nondecreasing === (remaining < 2 ? 0 : 1));
  }
  const overshoot: IRecoveryFeasibleTrialObservation = run(-0.25, -1.5, null, 3, "ordinary", 0.75);
  const full: IRecoveryFeasibleTrialObservation = run(-0.25, -1, null, 3, "ordinary", 0.5);
  const tie: IRecoveryFeasibleTrialObservation = run(-0.5, -1.5, null, 2);
  const gate: IRecoveryFeasibleTrialObservation = run(-0.5, -1.25, null, 3, "negative-gate");
  const armijo: IRecoveryFeasibleTrialObservation = run(-1e-6, -1.9999, null, 2);
  const halfGate: IRecoveryFeasibleTrialObservation = run(-0.5, -0.75, 0.5, 3, "half-gate");
  const halfArmijo: IRecoveryFeasibleTrialObservation = run(-0.5, -1.5, 0.5, 3, "half-armijo");
  const fallback: IRecoveryFeasibleTrialObservation = run(-4, -5, 0.1, 5);
  const unsupported: IRecoveryFeasibleTrialObservation = run(-0.5, -2, 0.5, 4, "unsupported");
  const unsupportedFallback: IRecoveryFeasibleTrialObservation = run(-4, -5, 0.1, 4, "unsupported");
  const nonfinite: IRecoveryFeasibleTrialObservation = run(-0.5, -1.25, null, 3, "nonfinite");
  const baseline: IRecoveryFeasibleTrialObservation = run(-0.5, null, null, 1);
  observations.push(overshoot, full, tie, gate, armijo, halfGate, halfArmijo, fallback, unsupported, unsupportedFallback, nonfinite, baseline);
  checks.push(overshoot.selected.state === 0.25 && overshoot.selected.cost === 3 / 64 && overshoot.trials.half === 1 &&
    full.selected.state === 0 && full.selected.cost === 0 && full.trials.qualifiedUnselected === 2 &&
    tie.selected.state === 0.5 && tie.trials.qualifiedUnselected === 1 &&
    gate.selected.state === 0.5 && gate.trials.infeasible === 1 && gate.trials.half === 0 &&
    armijo.selected.state === 1 - 1e-6 && armijo.trials.armijo === 1 &&
    halfGate.selected.state === 0.25 && halfGate.trials.infeasible === 1 && halfGate.corrections === 0 &&
    halfArmijo.selected.state === -0.5 && halfArmijo.trials.armijo === 1 && halfArmijo.corrections === 0 &&
    fallback.selected.state === 0 && fallback.selected.iterations === 5 && fallback.trials.baseline === 3 &&
    fallback.trials.nondecreasing === 4 && fallback.corrections === 1 &&
    unsupported.selected.state === 0.5 && unsupported.corrections === 0 && unsupported.trials.half === 0 &&
    unsupportedFallback.selected.state === 0 && unsupportedFallback.selected.iterations === 4 && unsupportedFallback.corrections === 0 &&
    nonfinite.selected.state === 0.5 && nonfinite.trials.infeasible === 1 &&
    baseline.selected.state === 0.5 && baseline.selected.iterations === 1);
  for (const mode of ["measure-throw", "retract-throw", "evaluate-throw", "checkpoint-throw", "charge-throw"]) {
    let original: boolean = false;
    try { run(-0.5, -2, 0.5, 4, mode); } catch (error: unknown) { original = error === marker; }
    checks.push(original);
  }
  for (const row of observations) checks.push(
    row.selected.accepted && !row.selected.stalled && row.checkpoints === row.selected.iterations &&
    row.states.length === row.selected.iterations && row.work === row.trials.work &&
    row.trials.baseline + row.trials.nominal + row.trials.numerical + row.trials.corrected + row.trials.half === row.selected.iterations &&
    1 + row.trials.qualifiedUnselected + row.trials.infeasible + row.trials.nondecreasing + row.trials.armijo === row.selected.iterations &&
    nclose(row.selected.cost, row.selected.state ** 2 * (row === overshoot ? 0.75 : row === full ? 0.5 : 1), 1e-12),
  );
  const exhausted: IRecoveryFeasibleTrialObservation = run(-4, null, null, 1);
  const stalled: IRecoveryFeasibleTrialObservation = run(-Number.MIN_VALUE, null, null, 2);
  let invalidHorizon: boolean = false;
  try { run(-0.5, null, null, 0); } catch (error: unknown) { invalidHorizon = error instanceof Error; }
  checks.push(!exhausted.selected.accepted && exhausted.selected.state === 1 && exhausted.selected.iterations === 1 &&
    exhausted.trials.nondecreasing === 1 && !exhausted.selected.stalled &&
    !stalled.selected.accepted && stalled.selected.state === 1 && stalled.selected.iterations === 1 &&
    stalled.selected.stalled && invalidHorizon);
  // At the same normal solution, a cheaper full mixture can retain a larger
  // v-gradient than baseline. Cost protection alone is not a KKT-rate theorem.
  const e: number = 1e-3, s: number = 1.5 * e, denominator: number = 4 + s * s;
  const tilted: number[] = [-s * s / denominator, -2 * s / denominator];
  const rho: number = s * s;
  const mixture: number[] = [rho * tilted[0]!, (1 - rho) * -s + rho * tilted[1]!];
  const sideTrials: IAutoMovieRecoveryFeasibleTrials = {
    baseline: 0, nominal: 0, numerical: 0, corrected: 0, half: 0, qualifiedUnselected: 0,
    infeasible: 0, nondecreasing: 0, armijo: 0, lastFailure: null, work: 0,
  };
  const sideCost: (x: readonly number[]) => number = (x: readonly number[]): number =>
    0.5 * (x[0]! - 1) ** 2 + 0.75 * x[1]! ** 2;
  const sideArc: IAutoMovieRecoverySqpArc = {
    step: mixture, sqpStep: null, multipliers: [], selected: [1], correct: null,
    report: {
      qualified: true, reason: "authored-cost-rate-limit", selectedRows: 1, coordinates: 2,
      designRatio: 1, maximumViolation: 0, equalityResidual: 0, stationarityResidual: 0,
      stationarityScale: 1, mixWeight: rho, equalityBeforeRefinement: 0, refinementAttempted: false,
      nominalMixWeight: rho, numericalMixAttempted: false, numericalMixSupported: false,
      correctionAttempted: false, correctionSupported: false, work: 0,
    },
  };
  const sideInitial: number[] = [0, e];
  const side: IAutoMovieRecoveryFeasibleTrialSelection<number[]> = selectRecoveryFeasibleTrial({
    initial: sideInitial, evaluate: (x: number[]): number | null => x[0]! <= 0 ? sideCost(x) : null,
    linearize: (): never => { throw new Error("same-model comparison required"); },
    retract: (x: number[], p: readonly number[]): number[] => x.map((value: number, at: number): number => value + p[at]!),
  }, sideInitial, sideCost(sideInitial), tilted, -tilted[0]! + s * tilted[1]!, sideArc,
  -mixture[0]! + s * mixture[1]!, 2, sideTrials, (): void => {}, (): void => {});
  const tiltedState: number[] = [tilted[0]!, e + tilted[1]!];
  checks.push(side.accepted && side.iterations === 2 &&
    side.cost < sideCost(tiltedState) && Math.abs(1.5 * side.state[1]!) > Math.abs(1.5 * tiltedState[1]!) &&
    sideTrials.qualifiedUnselected === 1 && sideInitial[0] === 0 && sideInitial[1] === e);
  TestValidator.predicate(`same-base actual selection: ${JSON.stringify({ observations, side, sideTrials, checks })}`, checks.every((value: boolean): boolean => value));
}
