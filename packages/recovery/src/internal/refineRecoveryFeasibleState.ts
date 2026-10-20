import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";
import type { IAutoMovieSimplexBudget } from "@automovie/engine/math/IAutoMovieSimplexBudget";

import type { IAutoMovieRecoveryFeasibleDirection } from "../structures/internal/IAutoMovieRecoveryFeasibleDirection";
import type { IAutoMovieRecoveryFeasibleDirectionReport } from "../structures/internal/IAutoMovieRecoveryFeasibleDirectionReport";
import type { IAutoMovieRecoveryFeasibleFit } from "../structures/internal/IAutoMovieRecoveryFeasibleFit";
import type { IAutoMovieRecoveryFeasibleModel } from "../structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryFeasibleProblem } from "../structures/internal/IAutoMovieRecoveryFeasibleProblem";
import type { IAutoMovieRecoveryFeasibleTrials } from "../structures/internal/IAutoMovieRecoveryFeasibleTrials";
import type { IAutoMovieRecoveryFeasibleTrialSelection } from "../structures/internal/IAutoMovieRecoveryFeasibleTrialSelection";
import type { IAutoMovieRecoverySqpArc } from "../structures/internal/IAutoMovieRecoverySqpArc";
import type { IAutoMovieRecoverySqpOptions } from "../structures/internal/IAutoMovieRecoverySqpOptions";
import type { IAutoMovieRecoverySqpReport } from "../structures/internal/IAutoMovieRecoverySqpReport";
import { createRecoveryFeasibleSqpArc } from "./createRecoveryFeasibleSqpArc";
import { solveRecoveryFeasibleDirection } from "./solveRecoveryFeasibleDirection";
import { selectRecoveryFeasibleTrial } from "./selectRecoveryFeasibleTrial";

/**
 * Refine a feasible fixed-population recovery state with strictly inward models.
 * A pure tilted QP supplies descent and active-constraint inwardness. Actual
 * retraction, all nonlinear gates and Armijo decrease must also pass. Only an
 * original-coordinate normal KKT certificate terminates successfully.
 * Optional acceleration separately certifies an untilted affine QP, mixes its
 * physical step with this baseline, and may reuse its factor for one same-base
 * order-2.5 curvature arc. Qualified same-base full candidates and one half on
 * the accelerated arc compete by original cost; ties retain the earlier one.
 * A mixture is not the baseline QP minimizer. Every evaluated candidate,
 * including qualified unselected candidates, consumes maxTrials allowance.
 * The last accepted endpoint receives a charged model check, not another step.
 *
 * @evidence contracts/common.md#principled-implementation For C1 inequalities at a feasible state, negative objective derivative and strictly inward active derivatives admit sufficiently small feasible descent when other gates are interior. Optional complete-affine-QP mixing and a same-base minimum-metric correction are separate candidates, not a global or finite-trial convergence theorem. Baseline original KKT alone terminates normally.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates direction and normal termination; a bounded same-base selector owns actual candidate ordering, while problem callbacks own metric/rank/gauge, full qualification and charged allocations. Rejected trials reuse the current direction without refitting observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No boundary stalling, tiny accepted step, small objective decrease, initial-state fallback or abnormal multiplier is called convergence. No population, threshold, metric coefficient or budget is changed after refusal.
 * @evidence contracts/common.md#meaningful-documentation States physical KKT tolerance, multiplier support floor, mixed Armijo slope, same-base t*d+t^2*delta and order2.5. The selector compares Tfull, Mfull, only failed-M SOCfull and one qualified-path half; exact ties keep the earlier candidate. Nominal min(1,physical SQP norm squared) and at most one original-row-derived support coefficient remain separate from actual selection and normal KKT.
 * @evidence contracts/performance.md#efficient-algorithms At most maxTrials actual evaluations and maxTrials+1 charged direction models run. Optional working transpose costs O(S*(q+H)*H^2+q*H^2); its one correction reuses the factor. Scans, inverse actions and every selected/unselected/full/half/backtracked geometry evaluation are charged under existing ceilings. Selection reserves256 visits per model and128+12*width per actual trial in addition to owner geometry work.
 * @evidence contracts/performance.md#reuse-equivalent-work Backtracking retains one current model/direction until an actual state change. Every certificate uses every original physical row, without shared input-dependent result caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current state and at most four detached comparison candidates coexist with borrowed checkpoints, current rows/metric and admitted thin factors/steps/correction. Problem owners admit that peak before copying. Unselected trials expire; only the last feasible state and bounded scalar reports transfer without history or external handles.
 */
export function refineRecoveryFeasibleState<State>(
  problem: IAutoMovieRecoveryFeasibleProblem<State>,
  maxTrials: number,
  tolerance: number,
  directionBudget: IAutoMovieSimplexBudget,
  checkpoint: () => void,
  charge: (work: number) => void,
  acceleration?: IAutoMovieRecoverySqpOptions,
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
  let lastSqp: IAutoMovieRecoverySqpReport | null = null;
  const trials: IAutoMovieRecoveryFeasibleTrials = {
    baseline: 0, nominal: 0, numerical: 0, corrected: 0, half: 0, qualifiedUnselected: 0,
    infeasible: 0, nondecreasing: 0, armijo: 0, lastFailure: null, work: 0,
  };
  let termination: IAutoMovieRecoveryFeasibleFit<State>["termination"] =
    "iteration-budget";
  while (true) {
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
    if (iterations >= maxTrials) {
      termination = "iteration-budget";
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
    let arc: IAutoMovieRecoverySqpArc | null = null;
    let mixedSlope: number = slopes[0]!;
    if (acceleration !== undefined && problem.constraintValues !== undefined && maxTrials - iterations >= 2) {
      arc = createRecoveryFeasibleSqpArc(
        model, direction.multipliers, step, tolerance,
        { ...acceleration, maxWork: Math.max(0, Math.min(acceleration.maxWork, directionBudget.maxWork - direction.work)) },
        charge,
      );
      lastSqp = arc.report;
      directionWork += arc.report.work;
      if (arc.step !== null) {
        mixedSlope = model.physicalRows[0]!.indices.reduce(
          (sum: number, axis: number, entry: number): number => sum + model.physicalRows[0]!.values[entry]! * arc!.step![axis]!, 0,
        );
      }
    }
    const selected: IAutoMovieRecoveryFeasibleTrialSelection<State> = selectRecoveryFeasibleTrial(
      problem, state, cost, step, slopes[0]!, arc, mixedSlope,
      maxTrials - iterations, trials, checkpoint, charge,
    );
    iterations += selected.iterations;
    if (!selected.accepted) {
      if (selected.stalled) termination = "abnormal-or-stalled";
      break;
    }
    state = selected.state;
    cost = selected.cost;
    acceptedSteps++;
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
    lastSqp,
    trials,
  };
}
