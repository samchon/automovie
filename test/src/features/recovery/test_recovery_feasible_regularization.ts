import { TestValidator } from "@nestia/e2e";

import { refineRecoveryFeasibleState } from "../../../../packages/recovery/src/internal/refineRecoveryFeasibleState";
import { updateRecoveryRegularization } from "../../../../packages/recovery/src/internal/updateRecoveryRegularization";
import type { IAutoMovieRecoveryFeasibleFit } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleFit";
import type { IAutoMovieRecoveryFeasibleModel } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryFeasibleProblem } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleProblem";
import type { IAutoMovieRecoveryRegularizationUpdate } from "../../../../packages/recovery/src/structures/image/IAutoMovieRecoveryRegularizationUpdate";
import type { AutoRecoveryRegularizationMode } from "../internal/AutoRecoveryRegularizationMode";
import type { IRecoveryRegularizationObservation } from "../internal/IRecoveryRegularizationObservation";
import { nclose } from "../internal/nclose";
import { runRecoveryRegularizationControl } from "../internal/runRecoveryRegularizationControl";

/**
 * Selected-increment metric reactions preserve actual horizons and normal stops.
 *
 * Scenarios:
 * 1. Scalar agreement increase, hold and decrease use the accepted-radius reciprocal; invalid decrease, ratio and next coefficient preserve the previous damping.
 * 2. Original-q affine least squares with epsilon1/.001 compares fixed1e-3, nonshipping oracle0 and accepted-agreement metrics under the same100 actual evaluations and physical normal tolerance.
 * 3. A nonlinear residual under vector soft-L1 has a qualified full step with poor actual agreement; only its next existing model increases damping. Notification receives the exact base/increment/cost and propagates the original error.
 * 4. Initial normal KKT and a refused actual trial notify zero times. Qualified-unselected evaluations consume trials but never notify.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls source update, generic controller and selector through the typed chosen-increment hook. Observes actual budgets, original normal status, next-model coefficients, notification identity and core error propagation without replacing a foreign function.
 * @evidence contracts/testing.md#independent-expectations The rotated original-q quadratic has hn=2+delta*(1+epsilon^2),ht=2*epsilon^2+delta*(1+epsilon^2). For epsilon.001 fixed damping, even100 untilted unit steps leave physical normal infinity above2.89e-7; original KKT determines the other outcomes rather than saved iteration counts. For r(x)=1+x+sqrt(.75)*x^2 at0, soft-L1 gradient and weighted GN give u=-1/1.001 and an independently computed positive ratio below.5, so the next coefficient must increase.
 * @evidence contracts/testing.md#distinguishing-cases Covers fixed versus adaptive and known-curvature oracle, weak full-rank progress, supported factor1, ratio and coefficient underflow/overflow, nonfinite and nonpositive prediction, terminal-model timing, initial KKT, refusal and original hook errors. Actual camera weighted-design prediction and half/SOC increment ownership are checked separately.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_feasible_regularization entry uses resident analytic arrays and source numerical routines without filesystem, compiler, processes, images, browser or GPU.
 */
export function test_recovery_feasible_regularization(): void {
  const supported: IAutoMovieRecoveryRegularizationUpdate[] = [0.25, 0.5, 1, 1e100].map(
    (ratio: number): IAutoMovieRecoveryRegularizationUpdate => updateRecoveryRegularization(0.001, ratio, 1),
  );
  const unsupported: IAutoMovieRecoveryRegularizationUpdate[] = [null, -1, 0, Number.NaN, Infinity].map(
    (prediction: number | null): IAutoMovieRecoveryRegularizationUpdate => updateRecoveryRegularization(0.001, 1, prediction),
  );
  unsupported.push(updateRecoveryRegularization(0.001, 0, 1),
    updateRecoveryRegularization(0.001, Number.MAX_VALUE, Number.MIN_VALUE),
    updateRecoveryRegularization(0.001, Number.MIN_VALUE, Number.MAX_VALUE),
    updateRecoveryRegularization(Number.MIN_VALUE, 1, 1),
    updateRecoveryRegularization(Number.MAX_VALUE, 0.25, 1));
  let invalidDamping: number = 0;
  for (const damping of [0, -1, Number.NaN, Infinity])
    try { updateRecoveryRegularization(damping, 1, 1); } catch { invalidDamping++; }
  TestValidator.predicate("computed agreement support and finite publication",
    supported.every((row: IAutoMovieRecoveryRegularizationUpdate): boolean => row.supported) &&
    nclose(supported[0]!.damping, 0.001125, 1e-15) && supported[1]!.damping === 0.001 &&
    supported[2]!.factor === 1 / 3 && supported[3]!.factor === 1 / 3 &&
    unsupported.every((row: IAutoMovieRecoveryRegularizationUpdate): boolean => !row.supported && row.damping === row.previousDamping &&
      [row.actualDecrease, row.predictedDecrease, row.ratio, row.factor].every((value: number | null): boolean => value === null || Number.isFinite(value))) && invalidDamping === 4);
  const controls: IRecoveryRegularizationObservation[] = [];
  for (const epsilon of [1, 0.001])
    for (const mode of ["fixed", "oracle", "agreement"] as const) {
      const condition: AutoRecoveryRegularizationMode = mode;
      const observed: IRecoveryRegularizationObservation = runRecoveryRegularizationControl(epsilon, condition);
      controls.push(observed);
      const fit: IAutoMovieRecoveryFeasibleFit<number[]> = observed.fit;
      const t: number = (fit.state[0]! - fit.state[1]!) / Math.SQRT2;
      const n: number = (fit.state[0]! + fit.state[1]!) / Math.SQRT2;
      const minimumNormal: number = Math.SQRT2 * epsilon * epsilon * Math.abs(t);
      const weakFixed: boolean = epsilon === 0.001 && mode === "fixed";
      TestValidator.predicate(`original physical normal and actual horizon epsilon${epsilon}/${mode}`,
        observed.damping.length === fit.acceptedSteps + 1 && observed.evaluations === fit.iterations + 1 &&
        observed.checkpoints === fit.iterations && fit.iterations <= 100 && n <= 0 &&
        (weakFixed ? !fit.converged && fit.termination === "iteration-budget" && fit.iterations === 100 && minimumNormal > 1e-8 &&
          fit.trials.infeasible + fit.trials.nondecreasing + fit.trials.armijo === 0 :
          fit.converged && fit.termination === "kkt" && minimumNormal <= 1e-8 && fit.stationarity! <= 1e-8 && fit.complementarity! <= 1e-8) &&
        (mode === "agreement" ? observed.reactions.length === fit.acceptedSteps && observed.reactions.every(
          (row: IAutoMovieRecoveryRegularizationUpdate): boolean => row.supported && row.factor === 1 / 3,
        ) : observed.reactions.length === 0));
    }
  const marker: Error = new Error("selected-notification-core");
  const curvature: number = Math.sqrt(0.75);
  const residual: (x: number) => number = (x: number): number => 1 + x + curvature * x * x;
  const objective: (x: number) => number = (x: number): number => Math.hypot(1, residual(x)) - 1;
  let coefficient: number = 0.001, currentBase: number = 0, currentGradient: number = 0, currentSquared: number = 0;
  let notifications: number = 0, checkpoints: number = 0, spent: number = 0;
  const coefficients: number[] = [], reactions: IAutoMovieRecoveryRegularizationUpdate[] = [];
  const problem: IAutoMovieRecoveryFeasibleProblem<number> = {
    initial: 0,
    evaluate: (x: number): number => objective(x),
    linearize: (x: number): IAutoMovieRecoveryFeasibleModel => {
      const r: number = residual(x), jacobian: number = 1 + 2 * curvature * x;
      const scale: number = Math.hypot(1, r);
      currentGradient = jacobian * r / scale;
      currentSquared = jacobian * jacobian / scale;
      currentBase = x;
      coefficients.push(coefficient);
      const root: number = Math.sqrt((1 + coefficient) * currentSquared);
      return { width: 1,
        physicalRows: [{ indices: [0], values: [currentGradient], offset: 0 }, { indices: [0], values: [0], offset: 1 }],
        rows: [{ indices: [0], values: [currentGradient / root], offset: 0 }, { indices: [0], values: [0], offset: 1 }],
        fromMetric: (z: readonly number[]): number[] => [z[0]! / root],
      };
    },
    retract: (x: number, u: readonly number[]): number => x + u[0]!,
    accepted: (base: number, u: readonly number[], oldCost: number, newCost: number): void => {
      notifications++;
      if (base !== currentBase || !nclose(oldCost, objective(base), 1e-15) || !nclose(newCost, objective(base + u[0]!), 1e-15)) throw marker;
      const update: IAutoMovieRecoveryRegularizationUpdate = updateRecoveryRegularization(coefficient,
        oldCost - newCost, -currentGradient * u[0]! - 0.5 * currentSquared * u[0]! * u[0]!);
      reactions.push(update);
      coefficient = update.damping;
    },
  };
  const fit: IAutoMovieRecoveryFeasibleFit<number> = refineRecoveryFeasibleState(problem, 1, 1e-8,
    { maxIterations: 100, maxEntries: 1000, maxWork: 100000 },
    (): void => { checkpoints++; }, (amount: number): void => { spent += amount; });
  const expectedStep: number = -1 / 1.001;
  const expectedPrediction: number = -expectedStep / Math.SQRT2 - 0.5 * expectedStep * expectedStep / Math.SQRT2;
  const expectedRatio: number = (objective(0) - objective(expectedStep)) / expectedPrediction;
  TestValidator.predicate("actual poor agreement prepares only the next terminal model",
    notifications === 1 && checkpoints === 1 && coefficients.length === 2 && !fit.converged &&
    fit.iterations === 1 && fit.acceptedSteps === 1 && nclose(fit.state, expectedStep, 1e-12) &&
    expectedRatio > 0 && expectedRatio < 0.5 && reactions[0]!.supported &&
    nclose(reactions[0]!.ratio!, expectedRatio, 1e-12) && coefficients[0] === 0.001 && coefficients[1]! > 0.001);
  const hooks: IAutoMovieRecoveryFeasibleProblem<number>[] = [
    { ...problem, evaluate: (): number => 0,
      linearize: (): IAutoMovieRecoveryFeasibleModel => ({ width: 1,
        rows: [{ indices: [0], values: [0], offset: 0 }],
        physicalRows: [{ indices: [0], values: [0], offset: 0 }],
        fromMetric: (z: readonly number[]): number[] => z.slice(),
      }), accepted: (): void => { throw marker; } },
    { ...problem, evaluate: (x: number): number | null => x === 0 ? objective(x) : null, accepted: (): void => { throw marker; } },
  ];
  const initialKkt: IAutoMovieRecoveryFeasibleFit<number> = refineRecoveryFeasibleState(hooks[0]!, 1, 1e-8,
    { maxIterations: 100, maxEntries: 1000, maxWork: 100000 }, (): void => {}, (): void => {});
  const refused: IAutoMovieRecoveryFeasibleFit<number> = refineRecoveryFeasibleState(hooks[1]!, 1, 1e-8,
    { maxIterations: 100, maxEntries: 1000, maxWork: 100000 }, (): void => {}, (): void => {});
  let originalError: boolean = false, errorTrials: number = 0, errorWork: number = 0;
  try {
    refineRecoveryFeasibleState({ ...problem, accepted: (): void => { throw marker; } }, 1, 1e-8,
      { maxIterations: 100, maxEntries: 1000, maxWork: 100000 },
      (): void => { errorTrials++; }, (amount: number): void => { errorWork += amount; });
  } catch (error: unknown) { originalError = error === marker; }
  TestValidator.predicate("no notification without selection and original error propagation",
    initialKkt.converged && initialKkt.iterations === 0 && refused.acceptedSteps === 0 && refused.iterations === 1 &&
    originalError && errorTrials === 1 && errorWork > 0 && spent > 0 && controls.length === 6);
  coefficient = 0.001;
  const absent: IAutoMovieRecoveryFeasibleFit<number> = refineRecoveryFeasibleState({ ...problem, accepted: undefined }, 1, 1e-8,
    { maxIterations: 100, maxEntries: 1000, maxWork: 100000 }, (): void => {}, (): void => {});
  coefficient = 0.001;
  let noopCalls: number = 0;
  const noop: IAutoMovieRecoveryFeasibleFit<number> = refineRecoveryFeasibleState({ ...problem, accepted: (): void => { noopCalls++; } }, 1, 1e-8,
    { maxIterations: 100, maxEntries: 1000, maxWork: 100000 }, (): void => {}, (): void => {});
  TestValidator.predicate("absent and no-op notifications retain fixed numerical behavior",
    noopCalls === noop.acceptedSteps && nclose(absent.state, noop.state, 1e-15) &&
    nclose(absent.finalCost, noop.finalCost, 1e-15) && absent.termination === noop.termination &&
    absent.iterations === noop.iterations && absent.directionWork === noop.directionWork &&
    absent.trials.work === noop.trials.work);
}
