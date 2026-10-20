import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";
import type { IAutoMovieSimplexBudget } from "@automovie/engine/math/IAutoMovieSimplexBudget";

import type { IAutoMovieRecoveryFeasibleDirection } from "../structures/internal/IAutoMovieRecoveryFeasibleDirection";
import type { IAutoMovieRecoveryFeasibleDirectionReport } from "../structures/internal/IAutoMovieRecoveryFeasibleDirectionReport";
import type { IAutoMovieRecoveryFeasibleFit } from "../structures/internal/IAutoMovieRecoveryFeasibleFit";
import type { IAutoMovieRecoveryFeasibleModel } from "../structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryFeasibleProblem } from "../structures/internal/IAutoMovieRecoveryFeasibleProblem";
import { solveRecoveryFeasibleDirection } from "./solveRecoveryFeasibleDirection";

/**
 * Refine a feasible fixed-population recovery state with strictly inward models.
 * A pure tilted QP supplies descent and active-constraint inwardness. Actual
 * retraction, all nonlinear gates and Armijo decrease must also pass. Only an
 * original-coordinate normal KKT certificate terminates successfully.
 *
 * @evidence contracts/common.md#principled-implementation For C1 inequalities at a feasible state, negative objective derivative and strictly inward active derivatives admit sufficiently small feasible descent when other qualification gates are interior. Backtracking checks actual gates rather than assuming this local premise globally. Positive objective dual permits original KKT reconstruction; vanishing objective dual is abnormal and refused.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates direction, actual retraction and normal termination; problem callbacks own metric/rank/gauge, full qualification and their charged allocations. Rejected trials reuse the current direction without refitting observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No boundary stalling, tiny accepted step, small objective decrease, initial-state fallback or abnormal multiplier is called convergence. No population, threshold, metric coefficient or budget is changed after refusal.
 * @evidence contracts/common.md#meaningful-documentation States original-unit KKT tolerance, stable objective multiplier floor sqrt(tolerance), fixed Armijo coefficient 1e-4, halved actual trials and explicit incomplete termination.
 * @evidence contracts/performance.md#efficient-algorithms At most maxTrials actual trials and maxTrials+1 direction models run; each direction has its own explicit sparse work/retention/iteration ceiling. Metric and complete geometry evaluations remain charged by the problem owner, while certificate scans cost O(n+m+Z).
 * @evidence contracts/performance.md#reuse-equivalent-work Backtracking retains one current model/direction until an actual state change. Every certificate uses every original physical row, without shared input-dependent result caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current state, one detached trial and one model/direction are retained. Failed trials expire, and only the last feasible state transfers, without observer history, external handles or hidden native workspace.
 */
export function refineRecoveryFeasibleState<State>(
  problem: IAutoMovieRecoveryFeasibleProblem<State>,
  maxTrials: number,
  tolerance: number,
  directionBudget: IAutoMovieSimplexBudget,
  checkpoint: () => void,
  charge: (work: number) => void,
): IAutoMovieRecoveryFeasibleFit<State> {
  if (
    !Number.isSafeInteger(maxTrials) ||
    maxTrials < 1 ||
    !(tolerance > 0 && tolerance < 1) ||
    !Number.isFinite(tolerance)
  )
    throw new Error(
      "camera-feasible: finite termination and trial limits required",
    );
  let state: State = problem.initial;
  let cost: number | null = problem.evaluate(state);
  if (cost === null || !Number.isFinite(cost))
    throw new Error("camera-feasible: actual feasible initial state required");
  const initialCost: number = cost;
  let iterations: number = 0,
    acceptedSteps: number = 0,
    directionWork: number = 0;
  let stationarity: number | null = null,
    complementarity: number | null = null;
  let stationarityScale: number | null = null, normalKktQualified: boolean = false;
  let lastDirection: IAutoMovieRecoveryFeasibleDirectionReport | null = null;
  let termination: IAutoMovieRecoveryFeasibleFit<State>["termination"] =
    "iteration-budget";
  while (iterations < maxTrials) {
    const model: IAutoMovieRecoveryFeasibleModel = problem.linearize(state);
    if (
      model.rows.length !== model.physicalRows.length ||
      model.rows.length < 1
    )
      throw new Error(
        "camera-feasible: matching complete metric and physical populations required",
      );
    const metadataWork: number = 4 * model.physicalRows.length;
    if (!Number.isSafeInteger(metadataWork))
      throw new Error("camera-feasible: bounded physical metadata required");
    charge(metadataWork);
    const physicalWork: number =
      16 *
        model.physicalRows.reduce(
          (sum: number, row: IAutoMovieSimplexAtom): number =>
            sum + row.indices.length,
          0,
        ) +
      8 * model.width +
      16 * model.physicalRows.length;
    if (!Number.isSafeInteger(physicalWork))
      throw new Error("camera-feasible: bounded original certificate required");
    charge(physicalWork);
    const direction: IAutoMovieRecoveryFeasibleDirection =
      solveRecoveryFeasibleDirection(
        model.width,
        model.rows,
        tolerance * tolerance,
        directionBudget,
        charge,
      );
    directionWork += direction.work + physicalWork + metadataWork;
    lastDirection = {
      termination: direction.termination, gamma: direction.gamma,
      objective: direction.objective, gap: direction.gap,
      maximumViolation: direction.maximumViolation, complementarity: direction.complementarity,
      arithmeticAllowance: direction.arithmeticAllowance,
      simplexResidual: direction.simplexResidual,
      stationarityResidual: direction.stationarityResidual,
      stationarityAllowance: direction.stationarityAllowance,
      returnedRowsQualified: direction.returnedRowsQualified,
      reconstructionRowsQualified: direction.reconstructionRowsQualified,
      aggregateAllowance: direction.aggregateAllowance,
      minimumPriceAllowance: direction.minimumPriceAllowance,
      gapAllowance: direction.gapAllowance,
      gapUpperBound: direction.gapUpperBound,
      exactGapTargetMet: direction.exactGapTargetMet,
      roundoffLimited: direction.roundoffLimited, certified: direction.certified,
      iterations: direction.iterations, work: direction.work,
    };
    const objectiveMultiplier: number = direction.multipliers[0]!;
    const gradient: number[] = new Array<number>(model.width).fill(0);
    let gradientScale: number = 1;
    complementarity = objectiveMultiplier >= Math.sqrt(tolerance) ? 0 : null;
    for (let at: number = 0; at < model.physicalRows.length; at++) {
      const row: IAutoMovieSimplexAtom = model.physicalRows[at]!;
      if (
        row.offset !== model.rows[at]!.offset ||
        row.offset < 0 ||
        !Number.isFinite(row.offset) ||
        row.indices.length !== row.values.length
      )
        throw new Error("camera-feasible: identical feasible offsets required");
      const multiplier: number =
        direction.multipliers[at]! / objectiveMultiplier;
      for (let entry: number = 0; entry < row.indices.length; entry++) {
        const axis: number = row.indices[entry]!;
        if (
          !Number.isSafeInteger(axis) ||
          axis < 0 ||
          axis >= model.width ||
          !Number.isFinite(row.values[entry])
        )
          throw new Error("camera-feasible: finite physical tangent required");
        if (complementarity !== null)
          gradient[axis]! += multiplier * row.values[entry]!;
        if (at === 0)
          gradientScale = Math.max(gradientScale, Math.abs(row.values[entry]!));
      }
      if (complementarity !== null)
        complementarity = Math.max(
          complementarity,
          Math.abs(multiplier * row.offset),
        );
    }
    stationarity =
      complementarity === null
        ? null
        : gradient.reduce(
            (maximum: number, value: number): number =>
              Math.max(maximum, Math.abs(value)),
            0,
          );
    stationarityScale = gradientScale;
    normalKktQualified =
      stationarity !== null &&
      complementarity !== null &&
      Number.isFinite(stationarity) &&
      Number.isFinite(complementarity) &&
      stationarity <= tolerance * gradientScale &&
      complementarity <= tolerance;
    // Diagnostics describe this model even when its QP is incomplete. Such a
    // model still cannot supply a successful nonlinear termination or trial.
    if (!direction.certified) {
      termination = "direction-incomplete";
      break;
    }
    if (normalKktQualified) {
      termination = "kkt";
      break;
    }
    const step: number[] = model.fromMetric(direction.step);
    if (step.length !== model.width || !step.every(Number.isFinite))
      throw new Error("camera-feasible: finite physical direction required");
    const slopes: number[] = model.physicalRows.map(
      (row: IAutoMovieSimplexAtom): number =>
        row.indices.reduce(
          (sum: number, axis: number, entry: number): number =>
            sum + row.values[entry]! * step[axis]!,
          0,
        ),
    );
    if (
      !(direction.gamma < 0 && direction.objective < 0 && slopes[0]! < 0) ||
      model.physicalRows.some(
        (row: IAutoMovieSimplexAtom, at: number): boolean =>
          row.offset === 0 && !(slopes[at]! < 0),
      )
    ) {
      termination = "abnormal-or-stalled";
      break;
    }
    let amount: number = 1,
      accepted: boolean = false;
    while (iterations < maxTrials) {
      checkpoint();
      iterations++;
      const trial: State = problem.retract(
        state,
        step.map((value: number): number => amount * value),
      );
      const trialCost: number | null = problem.evaluate(trial);
      if (
        trialCost !== null &&
        Number.isFinite(trialCost) &&
        trialCost < cost &&
        trialCost <= cost + 1e-4 * amount * slopes[0]!
      ) {
        state = trial;
        cost = trialCost;
        acceptedSteps++;
        accepted = true;
        break;
      }
      amount *= 0.5;
      if (
        amount === 0 ||
        step.every((value: number): boolean => amount * value === 0)
      ) {
        termination = "abnormal-or-stalled";
        break;
      }
    }
    if (!accepted) break;
  }
  return {
    state,
    converged: termination === "kkt",
    termination,
    iterations,
    acceptedSteps,
    initialCost,
    finalCost: cost,
    stationarity,
    stationarityScale,
    normalKktQualified,
    complementarity,
    directionWork,
    lastDirection,
  };
}
