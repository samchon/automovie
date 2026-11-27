import type {
  IAutoMovieRecoveryFeasibleDirection,
  IAutoMovieRecoveryFeasibleDirectionReport,
  IAutoMovieRecoveryFeasibleFit,
  IAutoMovieRecoveryFeasibleModel,
  IAutoMovieRecoveryFeasibleProblem,
  IAutoMovieRecoveryFeasibleTrialSelection,
  IAutoMovieRecoveryFeasibleTrials,
  IAutoMovieRecoverySqpArc,
  IAutoMovieRecoverySqpOptions,
  IAutoMovieRecoverySqpReport,
  IAutoMovieRecoveryUntiltedEstimate,
  IAutoMovieSimplexAtom,
  IAutoMovieSimplexBudget,
} from "@automovie/interface";

import { createRecoveryFeasibleSqpArc } from "../observation/internal/createRecoveryFeasibleSqpArc";
import { selectRecoveryFeasibleTrial } from "./selectRecoveryFeasibleTrial";
import { solveRecoveryFeasibleDirection } from "../observation/internal/solveRecoveryFeasibleDirection";

/**
 * Refine a feasible fixed-population recovery state with strictly inward
 * models. A pure tilted QP supplies descent and active-constraint inwardness.
 * Actual retraction, all nonlinear gates and Armijo decrease must also pass.
 * Only an original-coordinate normal KKT certificate terminates successfully.
 * Optional acceleration separately certifies an untilted affine QP, mixes its
 * physical step with this baseline, and may reuse its factor for one same-base
 * curvature arc with a 2.5 ceiling and dual-priced descent cap. Qualified
 * same-base full candidates and one half on the accelerated arc compete by
 * original cost; ties retain the earlier one. A mixture is not the baseline QP
 * minimizer. Every evaluated candidate, including qualified unselected
 * candidates, consumes maxTrials allowance. The last accepted endpoint receives
 * a charged model check, not another step. An optional owner notification
 * consumes the exact selected increment before changing the current state; it
 * cannot replace candidate or normal checks.
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
  if (maxTrials < 1 || !(tolerance > 0 && tolerance < 1))
    throw new Error(
      "camera-feasible: finite termination and trial limits required",
    );
  if (
    problem.requestUntiltedEstimate === true &&
    problem.accepted === undefined
  )
    throw new Error(
      "camera-feasible: requested estimate requires an accepted owner",
    );
  let state: State = problem.initial;
  let cost: number | null = problem.evaluate(state);
  if (cost === null)
    throw new Error("camera-feasible: actual feasible initial state required");
  const initialCost: number = cost;
  let iterations: number = 0,
    acceptedSteps: number = 0,
    directionWork: number = 0;
  let stationarity: number | null = null,
    complementarity: number | null = null;
  let stationarityScale: number | null = null,
    normalKktQualified: boolean = false;
  let objectiveMultiplier: number | null = null;
  let lastDirection: IAutoMovieRecoveryFeasibleDirectionReport | null = null;
  let lastSqp: IAutoMovieRecoverySqpReport | null = null;
  const trials: IAutoMovieRecoveryFeasibleTrials = {
    baseline: 0,
    nominal: 0,
    numerical: 0,
    corrected: 0,
    half: 0,
    qualifiedUnselected: 0,
    infeasible: 0,
    nondecreasing: 0,
    armijo: 0,
    lastFailure: null,
    work: 0,
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
    charge(metadataWork);
    const physicalWork: number =
      16 *
        model.physicalRows.reduce(
          (sum: number, row: IAutoMovieSimplexAtom): number =>
            sum + row.indices.length,
          0,
        ) +
      8 * model.width +
      16 * model.physicalRows.length +
      32;
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
      termination: direction.termination,
      gamma: direction.gamma,
      objective: direction.objective,
      gap: direction.gap,
      maximumViolation: direction.maximumViolation,
      complementarity: direction.complementarity,
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
      roundoffLimited: direction.roundoffLimited,
      certified: direction.certified,
      iterations: direction.iterations,
      work: direction.work,
    };
    objectiveMultiplier = direction.multipliers[0]!;
    const gradient: number[] = new Array<number>(model.width).fill(0);
    let gradientScale: number = 1;
    complementarity = objectiveMultiplier >= Math.sqrt(tolerance) ? 0 : null;
    for (let at: number = 0; at < model.physicalRows.length; at++) {
      const row: IAutoMovieSimplexAtom = model.physicalRows[at]!;
      if (
        row.offset !== model.rows[at]!.offset ||
        row.offset < 0 ||
        row.indices.length !== row.values.length
      )
        throw new Error("camera-feasible: identical feasible offsets required");
      const multiplier: number =
        direction.multipliers[at]! / objectiveMultiplier;
      for (let entry: number = 0; entry < row.indices.length; entry++) {
        const axis: number = row.indices[entry]!;
        if (axis < 0 || axis >= model.width)
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
    if (step.length !== model.width)
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
    if (
      acceleration !== undefined &&
      problem.constraintValues !== undefined &&
      maxTrials - iterations >= 2
    ) {
      arc = createRecoveryFeasibleSqpArc(
        model,
        direction.multipliers,
        step,
        tolerance,
        {
          ...acceleration,
          maxWork: Math.max(
            0,
            Math.min(
              acceleration.maxWork,
              directionBudget.maxWork - direction.work,
            ),
          ),
        },
        charge,
      );
      lastSqp = arc.report;
      directionWork += arc.report.work;
      if (arc.step !== null) {
        mixedSlope = model.physicalRows[0]!.indices.reduce(
          (sum: number, axis: number, entry: number): number =>
            sum + model.physicalRows[0]!.values[entry]! * arc!.step![axis]!,
          0,
        );
      }
    }
    const selected: IAutoMovieRecoveryFeasibleTrialSelection<State> =
      selectRecoveryFeasibleTrial(
        problem,
        state,
        cost,
        step,
        slopes[0]!,
        arc,
        mixedSlope,
        maxTrials - iterations,
        trials,
        checkpoint,
        charge,
      );
    iterations += selected.iterations;
    if (!selected.accepted) {
      if (selected.stalled) termination = "abnormal-or-stalled";
      break;
    }
    if (selected.increment === null)
      throw new Error("camera-feasible: selected actual increment required");
    if (problem.requestUntiltedEstimate === true) {
      charge(32);
      directionWork += 32;
      const estimate: IAutoMovieRecoveryUntiltedEstimate | null =
        arc?.report.qualified === true
          ? {
              width: model.width,
              rowCount: model.physicalRows.length,
              selected: arc.selected,
              multipliers: arc.multipliers,
            }
          : null;
      problem.accepted!(
        state,
        selected.increment,
        cost,
        selected.cost,
        estimate,
      );
    } else problem.accepted?.(state, selected.increment, cost, selected.cost);
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
    tolerance,
    objectiveMultiplier,
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
