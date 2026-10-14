import {
  type IAutoMovieQuadraticRow,
  admitAutoMovieQuadraticProgram,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";

import { HumanMeshNormalDomainError } from "../../common/mesh/HumanMeshNormalDomainError";
import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";
import type { IHumanBodyUnderwearFittingLinearization } from "./IHumanBodyUnderwearFittingLinearization";
import type { IHumanBodyUnderwearFittingProposal } from "./IHumanBodyUnderwearFittingProposal";
import type { IHumanBodyUnderwearMaterialEdge } from "./IHumanBodyUnderwearMaterialEdge";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceFit } from "./IHumanBodyUnderwearSurfaceFit";
import type { IHumanBodyUnderwearSurfaceFitInput } from "./IHumanBodyUnderwearSurfaceFitInput";
import type { IHumanBodyUnderwearTrialFailure } from "./IHumanBodyUnderwearTrialFailure";
import { createHumanBodyUnderwearFittingLinearizer } from "./createHumanBodyUnderwearFittingLinearizer";
import { createHumanBodyUnderwearSurfaceEvaluator } from "./createHumanBodyUnderwearSurfaceEvaluator";

/**
 * Restore the original connected material from a genuinely infeasible lift.
 *
 * Phase I obtains an L1 feasibility proposal, then a proximal proposal scaled by its actual full-affine decrease and normalized point/edge step metric. Rejected proposals resolve the same model at increased numerical curvature, while accepted proposals reduce curvature down to the first problem-derived positive coefficient, retained within this material invocation. The anchored model must majorize actual complete merit; original strict feasibility alone admits candidate geometry under the implemented local conditions. Native calls and actual trials share one work bound. The original nonlinear field and transported-normal lift are evaluated after every step; affine slack zero does not certify a strict geometric condition.
 *
 * Within each fixed affine model, restricted masters retain every hard row and select complete logical slack groups. Every original coefficient is admitted before selection, and every original affine row is separated after each accepted native return. All positive omitted groups enter together. Exact restricted optima with a zero-slack extension solve their declared full convex L1 or proximal model; approximate native output is not that certificate. A near-zero attained affine sum is not imposed as an exact energy tie-break cap. The proximal metric stabilizes the numerical step; it is neither the original absolute edge objective nor a physical displacement restriction.
 *
 * Once every original condition holds, Phase II proposes the original edge objective with the same actual lift derivatives and accepts only a feasible energy-nonincreasing candidate. No independent vertex projection, changed pin, normal flip, reduced lift or substituted original-plane orientation appears.
 *
 * The owning failure/status paths for nonlinear infeasibility, unavailable derivatives, native failure, a strict boundary with zero merit, stalled globalization and exhausted work attach the complete original readings. Other backend, programmer or observer exceptions can propagate unchanged. No feasible path, optimum, global embedding or rendered improvement is guaranteed.
 *
 * @evidence contracts/common.md#principled-implementation Connected relative-edge variables and original hard rows define the declared affine programs; proposals pass the actual normal/lift/field evaluator before accepted restoration or feasible nonincreasing Phase-II states replace current geometry.
 * @evidence contracts/common.md#clear-and-simple-design Phase-I grouped L1/proximal restoration and Phase-II original-edge optimization share one evaluator, linearizer, native-call path and material-sized work counter, with complete original refusal observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native status or zero slack never replaces strict forward conditions; unavailable derivatives, stalled represented movement and exhausted work refuse, and local geometry feasibility proves no global embedding, anatomy, physical cloth law or rendered improvement.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes restricted/full affine models, actual nonlinear merit, proximal numerical curvature, relative-edge objective, shared work budget and unresolved feasible-path/optimum guarantees.
 * @evidence contracts/performance.md#efficient-algorithms Source edge compilation is linear in indexed faces; each model/native/trial adds actual sparse-program and envelope work, with expensive full-row admission/separation repeated per restricted master and a material-sized bound on shared native/trial calls.
 * @evidence contracts/performance.md#reuse-equivalent-work Original normals, edge/hard rows and compiled derivative owners persist within the fit; logical slack groups retain equivalent witnesses and restricted masters reuse selected groups while separating every original row.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Observations intentionally retain native results and trial coordinate buffers up to the shared work bound, so memory can grow with source size times spent work; outputs or refusal payload own that history, and dropping the invocation releases temporary models without external handles owned here.
 */
export function fitHumanBodyUnderwearSurface(
  input: IHumanBodyUnderwearSurfaceFitInput,
): IHumanBodyUnderwearSurfaceFit {
  const {
    points,
    indices,
    envelope,
    rho,
    sourceVertices,
  }: IHumanBodyUnderwearSurfaceFitInput = input;
  const count: number = points.length / 3;
  if (
    sourceVertices.length !== count ||
    Array.from(sourceVertices).some(
      (v: number): boolean => !Number.isSafeInteger(v) || v < 0,
    ) ||
    new Set(sourceVertices).size !== count
  )
    throw new Error(
      "Garment fitting requires its actual component-to-cut vertex correspondence.",
    );
  let rounds: number = 0,
    workUsed: number = 0;
  const observe: IHumanBodyUnderwearSurfaceFitInput["observeFitting"] =
    input.observeFitting;
  let callbackFailed: boolean = false;
  // Candidate events report this invocation's actual native/work context.
  const evaluate: ReturnType<typeof createHumanBodyUnderwearSurfaceEvaluator> =
    createHumanBodyUnderwearSurfaceEvaluator({
      ...input,
      observeFitting:
        observe === undefined
          ? undefined
          : (
              stage: Parameters<
                NonNullable<
                  IHumanBodyUnderwearSurfaceFitInput["observeFitting"]
                >
              >[0],
              details: Parameters<
                NonNullable<
                  IHumanBodyUnderwearSurfaceFitInput["observeFitting"]
                >
              >[1],
            ): void => {
              try {
                observe(stage, {
                  ...details,
                  garmentRound: rounds === 0 ? undefined : rounds - 1,
                  garmentWorkUsed: workUsed,
                  garmentWorkBound: count,
                });
              } catch (error: unknown) {
                callbackFailed = true;
                throw error;
              }
            },
    });
  const linearize: ReturnType<
    typeof createHumanBodyUnderwearFittingLinearizer
  > = createHumanBodyUnderwearFittingLinearizer(
    input,
    (reason: string, current: IHumanBodyUnderwearSurfaceEvaluation): never =>
      fail(reason, current),
  );
  const edges: IHumanBodyUnderwearMaterialEdge[] = [],
    seen: Set<string> = new Set<string>();
  const used: Uint8Array = new Uint8Array(count);
  for (let t: number = 0; t < indices.length; t += 3)
    for (let k: number = 0; k < 3; k++) {
      const a: number = Math.min(indices[t + k], indices[t + ((k + 1) % 3)]);
      const b: number = Math.max(indices[t + k], indices[t + ((k + 1) % 3)]);
      used[a] = 1;
      used[b] = 1;
      const key: string = a + ":" + b;
      if (seen.has(key)) continue;
      seen.add(key);
      const length: number = Math.hypot(
        ...[0, 1, 2].map(
          (axis: number): number => points[a * 3 + axis] - points[b * 3 + axis],
        ),
      );
      if (!(length > 0) || !Number.isFinite(length))
        throw new Error(
          "Garment material edges require finite positive lengths.",
        );
      edges.push({ a, b, length });
    }
  if (used.some((flag: number): boolean => flag === 0))
    throw new Error(
      "Garment fitting cannot invent connectivity for an unused material point.",
    );
  const variables: number = points.length + edges.length * 3;
  const diagonal: number[] = Array.from(
    { length: variables },
    (_: unknown, i: number): number => (i < points.length ? 0 : 1),
  );
  const hard: IAutoMovieQuadraticRow[] = [];
  edges.forEach(
    ({ a, b, length }: IHumanBodyUnderwearMaterialEdge, edge: number): void => {
      for (let axis: number = 0; axis < 3; axis++)
        hard.push({
          indices: [
            a * 3 + axis,
            b * 3 + axis,
            points.length + edge * 3 + axis,
          ],
          weights: [rho / length, -rho / length, -1],
          lower: 0,
          upper: 0,
        });
    },
  );
  for (let v: number = 0; v < count; v++)
    if (envelope.free[v])
      for (let k: number = 0; k < 3; k++)
        hard.push({ indices: [v * 3 + k], weights: [1], lower: 0, upper: 0 });
  const scale: number = points.reduce(
    (maximum: number, value: number): number =>
      Math.max(maximum, Math.abs(value)),
    rho,
  );
  const resolution: number = 2 ** (Math.floor(Math.log2(scale)) - 23);
  const observations: IHumanBodyUnderwearFitObservation[] = [];
  const trialFailures: IHumanBodyUnderwearTrialFailure[] = [];
  const objective: (base: readonly number[]) => number = (
    base: readonly number[],
  ): number =>
    edges.reduce(
      (total: number, edge: IHumanBodyUnderwearMaterialEdge): number => {
        let squared: number = 0;
        for (let k: number = 0; k < 3; k++) {
          const change: number =
            (base[edge.a * 3 + k] -
              points[edge.a * 3 + k] -
              (base[edge.b * 3 + k] - points[edge.b * 3 + k])) /
            edge.length;
          squared += change * change;
        }
        return total + squared / 2;
      },
      0,
    );
  const fail: (
    reason: string,
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model?: IHumanBodyUnderwearFittingLinearization | null,
  ) => never = (
    reason: string,
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization | null = null,
  ): never => {
    throw new Error(
      reason +
        ": " +
        JSON.stringify({
          observations,
          trialFailures,
          base: current.base,
          positions: current.positions,
          normals: current.normals,
          fieldResidualMetres: current.fieldResidualMetres,
          geometryViolations: current.violations,
          derivativeFailures: model?.lift.unavailable ?? [],
          normalizedViolationSum: model?.violationSum ?? null,
          sourceVertices,
          componentIndices: indices,
          free: Array.from(envelope.free),
          resolutionMetres: resolution,
          edgeObjective: objective(current.base),
          rounds,
          workUsed,
          workBound: count,
        }),
    );
  };
  const domain: (current: IHumanBodyUnderwearSurfaceEvaluation) => boolean = (
    current: IHumanBodyUnderwearSurfaceEvaluation,
  ): boolean =>
    current.base.every(Number.isFinite) &&
    current.positions.every(Number.isFinite) &&
    current.normals.every(Number.isFinite) &&
    current.violations.every(
      (
        violation: IHumanBodyUnderwearSurfaceEvaluation["violations"][number],
      ): boolean =>
        violation.condition === "offset-path" ||
        violation.condition === "final-area",
    );
  const feasible: (current: IHumanBodyUnderwearSurfaceEvaluation) => boolean = (
    current: IHumanBodyUnderwearSurfaceEvaluation,
  ): boolean => current.geometryAccepted && current.fieldResidualMetres <= 0;
  const finish: (
    current: IHumanBodyUnderwearSurfaceEvaluation,
  ) => IHumanBodyUnderwearSurfaceFit = (
    current: IHumanBodyUnderwearSurfaceEvaluation,
  ): IHumanBodyUnderwearSurfaceFit => {
    const final: IHumanBodyUnderwearSurfaceEvaluation = evaluate(current.base);
    if (!feasible(final))
      fail("Garment final geometry fails an original actual condition", final);
    if (observations.length !== 0)
      observations[observations.length - 1].trialFailures = trialFailures;
    return { positions: final.base, evaluation: final, observations };
  };
  const spend: (
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
  ) => void = (
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
  ): void => {
    if (workUsed >= count)
      fail(
        "Garment fitting exhausted its shared material-sized work bound",
        current,
        model,
      );
    workUsed++;
  };
  const solve: (
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
    rows: readonly IAutoMovieQuadraticRow[],
    actualDiagonal: readonly number[],
    linear: readonly number[],
    phase: IHumanBodyUnderwearFitObservation["phase"],
    selectedElasticGroups?: readonly number[],
    originalAffineRows?: readonly number[],
    proximalCoefficient?: number,
  ) => ReturnType<typeof solveAutoMovieQuadraticProgram> = (
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
    rows: readonly IAutoMovieQuadraticRow[],
    actualDiagonal: readonly number[],
    linear: readonly number[],
    phase: IHumanBodyUnderwearFitObservation["phase"],
    selectedElasticGroups?: readonly number[],
    originalAffineRows?: readonly number[],
    proximalCoefficient?: number,
  ): ReturnType<typeof solveAutoMovieQuadraticProgram> => {
    spend(current, model);
    if (input.observeFitting !== undefined) {
      let entries: number = 0,
        minimum: number | null = null,
        maximum: number = 0;
      for (const row of rows) {
        entries += row.weights.length;
        for (const weight of row.weights) {
          const absolute: number = Math.abs(weight);
          maximum = Math.max(maximum, absolute);
          if (absolute > 0)
            minimum = minimum === null ? absolute : Math.min(minimum, absolute);
        }
      }
      input.observeFitting("garment-affine-program-assembled", {
        garmentPhase: phase,
        garmentRound: rounds,
        garmentWorkUsed: workUsed,
        garmentWorkBound: count,
        garmentVariables: actualDiagonal.length,
        garmentRows: rows.length,
        garmentEntries: entries,
        garmentMinimumNonzeroCoefficient: minimum,
        garmentMaximumCoefficient: maximum,
      });
    }
    const result: ReturnType<typeof solveAutoMovieQuadraticProgram> =
      solveAutoMovieQuadraticProgram({
        diagonal: actualDiagonal,
        linear,
        rows,
      });
    const elasticSlackSum: number = result.primal
      .slice(variables)
      .reduce((sum: number, value: number): number => sum + value, 0);
    observations.push({
      round: rounds++,
      phase,
      status: result.status,
      nativeIterations: result.iterations,
      nativeMaximumViolation: result.maximumViolation,
      nativeStationarityResidual: result.stationarityResidual,
      fieldResidualMetres: current.fieldResidualMetres,
      resolutionMetres: resolution,
      edgeObjective: objective(current.base),
      geometryViolations: current.violations,
      normalizedViolationSum: model.violationSum,
      elasticSlackSum,
      derivativeFailures: model.lift.unavailable,
      nativeResult: result,
      selectedElasticGroups,
      originalAffineRows,
      originalHardRows: hard.length,
      proximalCoefficient,
    });
    input.observeFitting?.("garment-native-round-completed", {
      garmentPhase: phase,
      garmentRound: rounds - 1,
      garmentWorkUsed: workUsed,
      garmentWorkBound: count,
      garmentFittingRound: {
        round: rounds - 1,
        phase,
        status: result.status,
        nativeIterations: result.iterations,
        nativeMaximumViolation: result.maximumViolation,
        nativeStationarityResidual: result.stationarityResidual,
        fieldResidualMetres: current.fieldResidualMetres,
        normalizedViolationSum: model.violationSum,
        elasticSlackSum,
        edgeObjective: objective(current.base),
        proximalCoefficient,
      },
    });
    if (
      result.status !== 1 ||
      !result.primal.every(Number.isFinite) ||
      result.maximumViolation > resolution / rho
    )
      fail(
        "Garment fitting did not solve its original affine program: " +
          JSON.stringify({ native: result, rows }),
        current,
        model,
      );
    return result;
  };
  const target: (primal: readonly number[]) => number[] = (
    primal: readonly number[],
  ): number[] =>
    points.map((value: number, i: number): number =>
      envelope.free[Math.floor(i / 3)] ? value : value + rho * primal[i],
    );
  const between: (
    from: readonly number[],
    to: readonly number[],
    step: number,
  ) => number[] = (
    from: readonly number[],
    to: readonly number[],
    step: number,
  ): number[] =>
    from.map((value: number, i: number): number =>
      envelope.free[Math.floor(i / 3)]
        ? points[i]
        : value + step * (to[i] - value),
    );
  const trialAt: (
    base: number[],
    phase: IHumanBodyUnderwearTrialFailure["phase"],
    step: number,
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
  ) => IHumanBodyUnderwearSurfaceEvaluation | null = (
    base: number[],
    phase: IHumanBodyUnderwearTrialFailure["phase"],
    step: number,
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
  ): IHumanBodyUnderwearSurfaceEvaluation | null => {
    spend(current, model);
    if (!base.every(Number.isFinite)) {
      trialFailures.push({
        base,
        phase,
        step,
        reason:
          "Garment evaluation needs the complete finite candidate material.",
        geometryViolations: [],
        fieldResidualMetres: null,
        edgeObjective: null,
      });
      return null;
    }
    try {
      const trial: IHumanBodyUnderwearSurfaceEvaluation | null = evaluate(base);
      if (!feasible(trial))
        trialFailures.push({
          base,
          phase,
          step,
          reason:
            "This candidate has not satisfied every original final condition.",
          geometryViolations: trial.violations,
          fieldResidualMetres: trial.fieldResidualMetres,
          edgeObjective: objective(base),
          evaluation: trial,
        });
      return trial;
    } catch (error: unknown) {
      // This exact numerical-domain refusal belongs to areaWeightedNormals.
      // Every other evaluator, Source, programmer or backend exception propagates.
      if (
        callbackFailed ||
        !(error instanceof HumanMeshNormalDomainError) ||
        base.every(
          (value: number, i: number): boolean => value === current.base[i],
        )
      )
        throw error;
      trialFailures.push({
        base,
        phase,
        step,
        reason: error.message,
        geometryViolations: [],
        fieldResidualMetres: null,
        edgeObjective: null,
      });
      return null;
    }
  };
  const phaseOneTarget: (
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
    selected: Set<number>,
    coefficient?: number,
  ) => IHumanBodyUnderwearFittingProposal = (
    current: IHumanBodyUnderwearSurfaceEvaluation,
    model: IHumanBodyUnderwearFittingLinearization,
    selected: Set<number>,
    coefficient?: number,
  ): IHumanBodyUnderwearFittingProposal => {
    // One fixed full affine model owns every row and tied-witness group.
    // Selection schedules native work; it never changes the original population.
    const excesses: (primal: readonly number[], raw?: number[]) => number[] = (
      primal: readonly number[],
      raw?: number[],
    ): number[] => {
      const values: number[] = new Array<number>(model.elasticCount).fill(0);
      const readings: number[] = raw ?? [],
        unavailable: number[] = [];
      model.rows.forEach((row: IAutoMovieQuadraticRow, at: number): void => {
        const value: number =
          row.indices.reduce(
            (sum: number, column: number, coordinate: number): number =>
              sum + row.weights[coordinate] * primal[column],
            0,
          ) - row.upper!;
        if (!Number.isFinite(value)) unavailable.push(at);
        readings.push(value);
        const group: number = model.elasticGroups[at];
        values[group] = Math.max(values[group], value);
      });
      if (unavailable.length > 0)
        fail(
          "Garment full affine separation is unavailable: " +
            JSON.stringify({
              rows: unavailable,
              original: unavailable.map(
                (at: number): IAutoMovieQuadraticRow => model.rows[at],
              ),
              excesses: readings,
            }),
          current,
          model,
        );
      return values;
    };
    const centre: number[] = new Array<number>(variables).fill(0);
    for (let at: number = 0; at < points.length; at++)
      centre[at] = (current.base[at] - points[at]) / rho;
    for (let at: number = 0; at < edges.length * 3; at++) {
      const row: IAutoMovieQuadraticRow = hard[at];
      centre[row.indices[2]] =
        row.weights[0] * centre[row.indices[0]] +
        row.weights[1] * centre[row.indices[1]];
    }
    if (!centre.every(Number.isFinite))
      fail(
        "Garment original normalized point/edge centre is unavailable",
        current,
        model,
      );
    const fullDimension: number = variables + model.elasticCount;
    const fullRows: IAutoMovieQuadraticRow[] = [...hard];
    model.rows.forEach((row: IAutoMovieQuadraticRow, at: number): number =>
      fullRows.push({
        indices: [...row.indices, variables + model.elasticGroups[at]],
        weights: [...row.weights, -1],
        lower: null,
        upper: row.upper,
      }),
    );
    for (let group: number = 0; group < model.elasticCount; group++)
      fullRows.push({
        indices: [variables + group],
        weights: [1],
        lower: 0,
        upper: null,
      });
    const master: (
      coefficient?: number,
    ) => ReturnType<typeof solveAutoMovieQuadraticProgram> = (
      coefficient?: number,
    ): ReturnType<typeof solveAutoMovieQuadraticProgram> => {
      const diagonalAt: (at: number) => number = (at: number): number =>
        at < variables && coefficient !== undefined ? coefficient : 0;
      const linearAt: (at: number) => number = (at: number): number =>
        at >= variables
          ? 1
          : coefficient === undefined
            ? 0
            : -coefficient * centre[at];
      // Every full coefficient and expanded objective is admitted before restriction.
      admitAutoMovieQuadraticProgram({
        diagonal: Array.from(
          { length: fullDimension },
          (_: unknown, at: number): number => diagonalAt(at),
        ),
        linear: Array.from(
          { length: fullDimension },
          (_: unknown, at: number): number => linearAt(at),
        ),
        rows: fullRows,
      });
      excesses(centre).forEach((value: number, group: number): void => {
        if (value > 0) selected.add(group);
      });
      for (;;) {
        const groups: number[] = [...selected].sort(
          (a: number, b: number): number => a - b,
        );
        const lookup: Map<number, number> = new Map(
          groups.map((group: number, at: number): [number, number] => [
            group,
            variables + at,
          ]),
        );
        const originalRows: number[] = [];
        const rows: IAutoMovieQuadraticRow[] = [...hard];
        model.rows.forEach((row: IAutoMovieQuadraticRow, at: number): void => {
          const column: number | undefined = lookup.get(
            model.elasticGroups[at],
          );
          if (column === undefined) return;
          originalRows.push(at);
          rows.push({
            indices: [...row.indices, column],
            weights: [...row.weights, -1],
            lower: null,
            upper: row.upper,
          });
        });
        for (const group of groups)
          rows.push({
            indices: [lookup.get(group)!],
            weights: [1],
            lower: 0,
            upper: null,
          });
        const dimension: number = variables + groups.length;
        const solved: ReturnType<typeof solveAutoMovieQuadraticProgram> = solve(
          current,
          model,
          rows,
          Array.from({ length: dimension }, (_: unknown, at: number): number =>
            diagonalAt(at),
          ),
          Array.from({ length: dimension }, (_: unknown, at: number): number =>
            linearAt(at),
          ),
          coefficient === undefined ? "feasibility" : "feasibility-energy",
          groups,
          originalRows,
          coefficient,
        );
        const raw: number[] = [];
        const fullExcess: number[] = excesses(solved.primal, raw);
        const observation: IHumanBodyUnderwearFitObservation =
          observations[observations.length - 1];
        observation.originalAffineExcesses = raw;
        observation.originalElasticGroups = model.elasticGroups;
        const added: number[] = fullExcess.flatMap(
          (value: number, group: number): number[] =>
            value > 0 && !selected.has(group) ? [group] : [],
        );
        if (added.length > 0) {
          for (const group of added) selected.add(group);
          continue;
        }
        return solved;
      }
    };
    const before: number = excesses(centre).reduce(
      (sum: number, value: number): number => sum + value,
      0,
    );
    let actualCoefficient: number | undefined = coefficient;
    if (actualCoefficient === undefined) {
      const first: ReturnType<typeof solveAutoMovieQuadraticProgram> = master();
      const after: number = excesses(first.primal).reduce(
        (sum: number, value: number): number => sum + value,
        0,
      );
      const decrease: number = before - after;
      let metric: number = 0;
      for (let at: number = 0; at < variables; at++)
        metric += (first.primal[at] - centre[at]) ** 2;
      actualCoefficient = decrease / metric;
      if (
        !(decrease > 0) ||
        !Number.isFinite(decrease) ||
        !(metric > 0) ||
        !Number.isFinite(metric) ||
        !(actualCoefficient > 0) ||
        !Number.isFinite(actualCoefficient)
      )
        fail(
          "Garment original affine proposal has no finite decreasing proximal scale: " +
            JSON.stringify({
              before,
              after,
              decrease,
              metric,
              coefficient: actualCoefficient,
            }),
          current,
          model,
        );
    }
    const proximal: ReturnType<typeof solveAutoMovieQuadraticProgram> =
      master(actualCoefficient);
    const affineMerit: number = excesses(proximal.primal).reduce(
      (sum: number, value: number): number => sum + value,
      0,
    );
    let metricSquared: number = 0;
    for (let at: number = 0; at < variables; at++)
      metricSquared += (proximal.primal[at] - centre[at]) ** 2;
    // Exact m(c)=F(c); compare changes to retain the represented affine cancellation offset.
    const regularizedMerit: number =
      affineMerit + (actualCoefficient * metricSquared) / 2;
    return {
      base: target(proximal.primal),
      normalizedCoordinates: proximal.primal.slice(0, variables),
      coefficient: actualCoefficient,
      metricSquared,
      affineCurrentMerit: before,
      affineMerit,
      regularizedMerit,
      predictedReduction: before - regularizedMerit,
      currentMerit: model.violationSum,
      actualMerit: null,
      actualReduction: null,
      domainQualified: false,
      derivativeUnavailable: null,
      geometryFailureCounts: {},
      decision: "pending",
      step: 1,
    };
  };
  let current: IHumanBodyUnderwearSurfaceEvaluation = evaluate(points);
  input.observeFitting?.("garment-initial-evaluated", {
    garmentFieldResidualMetres: current.fieldResidualMetres,
    garmentGeometryFailures: current.violations.length,
    garmentWorkUsed: workUsed,
    garmentWorkBound: count,
  });
  if (!domain(current))
    fail(
      "Garment original cut lacks its finite qualified base evaluation domain",
      current,
    );
  // Zero relative-edge departure is the attained global lower bound; an
  // already strictly feasible unchanged material needs no derivative or QP.
  if (feasible(current) && objective(current.base) === 0)
    return finish(current);
  let model: IHumanBodyUnderwearFittingLinearization = linearize(current);
  let coefficient: number | undefined;
  let minimumCoefficient: number | undefined;
  while (!feasible(current)) {
    if (model.lift.unavailable.length > 0)
      fail(
        "Garment infeasible-start restoration has unavailable actual lift derivatives",
        current,
        model,
      );
    if (!(model.violationSum > 0) || !Number.isFinite(model.violationSum))
      fail(
        "Garment zero elastic merit has not established original strict feasibility",
        current,
        model,
      );
    const selected: Set<number> = new Set<number>();
    let previous: IHumanBodyUnderwearFittingProposal | null = null;
    for (;;) {
      const proposal: IHumanBodyUnderwearFittingProposal = phaseOneTarget(
        current,
        model,
        selected,
        coefficient,
      );
      minimumCoefficient = minimumCoefficient ?? proposal.coefficient;
      if (!proposal.base.every(Number.isFinite))
        fail(
          "Garment affine restoration produced unavailable candidate coordinates: " +
            JSON.stringify(proposal),
          current,
          model,
        );
      if (
        !(proposal.metricSquared > 0) ||
        !Number.isFinite(proposal.metricSquared) ||
        !Number.isFinite(proposal.predictedReduction)
      )
        fail(
          "Garment original proximal metric or prediction is not representable: " +
            JSON.stringify(proposal),
          current,
          model,
        );
      const trial: IHumanBodyUnderwearSurfaceEvaluation | null = trialAt(
        proposal.base,
        "feasibility",
        proposal.step,
        current,
        model,
      );
      const refusal: IHumanBodyUnderwearTrialFailure | undefined =
        trialFailures[trialFailures.length - 1];
      if (refusal?.base === proposal.base) refusal.proposal = proposal;
      proposal.domainQualified = trial !== null && domain(trial);
      for (const violation of trial?.violations ?? [])
        proposal.geometryFailureCounts[violation.condition] =
          (proposal.geometryFailureCounts[violation.condition] ?? 0) + 1;
      const trialModel: IHumanBodyUnderwearFittingLinearization | null =
        proposal.domainQualified ? linearize(trial!) : null;
      proposal.derivativeUnavailable =
        trialModel?.lift.unavailable.length ?? null;
      if (refusal?.base === proposal.base && trialModel !== null)
        refusal.derivativeFailures = trialModel.lift.unavailable;
      if (trialModel !== null && trialModel.lift.unavailable.length === 0) {
        proposal.actualMerit = trialModel.violationSum;
        proposal.actualReduction = model.violationSum - trialModel.violationSum;
      }
      const geometryFeasible: boolean = trial !== null && feasible(trial);
      const accepted: boolean =
        proposal.domainQualified &&
        (geometryFeasible ||
          (proposal.predictedReduction > 0 &&
            proposal.actualReduction !== null &&
            proposal.actualReduction >= proposal.predictedReduction));
      let failure: string | null = null;
      let nextCoefficient: number | undefined;
      proposal.decision = accepted
        ? geometryFeasible
          ? "accepted-feasible"
          : "accepted-agreement"
        : !proposal.domainQualified
          ? "rejected-domain"
          : proposal.derivativeUnavailable !== 0
            ? "rejected-derivative"
            : "rejected-agreement";
      if (!accepted) {
        if (
          proposal.actualMerit !== null &&
          !Number.isFinite(proposal.actualMerit)
        )
          failure = "Garment original actual merit is not representable.";
        else if (!(proposal.predictedReduction > 0))
          failure =
            "Garment native proposal has no positive original model decrease.";
        else if (
          previous !== null &&
          proposal.base.every(
            (value: number, i: number): boolean => value === previous!.base[i],
          ) &&
          (proposal.actualReduction === null || !(proposal.actualReduction > 0))
        )
          failure =
            "Garment revised proximal model repeated a rejected base without an available positive actual reduction.";
        else {
          // Exact convex H-feasible witnesses leave this proposal when lambda*S exceeds m(c)-m(z).
          // Approximate native output is not that certificate; original forward guards still decide.
          const domainScale: number = proposal.domainQualified
            ? proposal.coefficient
            : Math.max(
                proposal.coefficient,
                (proposal.affineCurrentMerit - proposal.affineMerit) /
                  proposal.metricSquared,
              );
          const required: number =
            proposal.actualMerit === null
              ? domainScale
              : (2 *
                  (proposal.actualMerit -
                    proposal.currentMerit -
                    (proposal.affineMerit - proposal.affineCurrentMerit))) /
                proposal.metricSquared;
          // Cross the measured boundary with numerical growth; original agreement stays strict.
          nextCoefficient = 2 * Math.max(proposal.coefficient, required);
          if (
            (proposal.actualMerit !== null &&
              !(required > proposal.coefficient)) ||
            !(nextCoefficient > proposal.coefficient) ||
            !Number.isFinite(nextCoefficient)
          )
            failure =
              "Garment failed agreement has no finite representably increasing model curvature: " +
              String(required) +
              " -> " +
              String(nextCoefficient);
        }
      }
      proposal.nextCoefficient = accepted
        ? Math.max(minimumCoefficient, proposal.coefficient / 2)
        : nextCoefficient;
      if (failure !== null) {
        proposal.decision = "failed-model";
        proposal.failureReason = failure;
      }
      const {
        base,
        normalizedCoordinates,
        ...scalars
      }: IHumanBodyUnderwearFittingProposal = proposal;
      input.observeFitting?.("garment-proposal-evaluated", {
        garmentPhase: "feasibility-energy",
        garmentRound: rounds - 1,
        garmentWorkUsed: workUsed,
        garmentWorkBound: count,
        garmentProposal: scalars,
        garmentFieldResidualMetres: trial?.fieldResidualMetres,
        garmentGeometryFailures: trial?.violations.length,
      });
      if (failure !== null)
        fail(failure + ": " + JSON.stringify(proposal), current, model);
      coefficient = proposal.nextCoefficient;
      if (accepted) {
        current = trial!;
        model = trialModel!;
        break;
      }
      previous = proposal;
    }
  }
  let energy: number = objective(current.base);
  if (energy === 0) return finish(current);
  for (;;) {
    model = linearize(current);
    if (model.lift.unavailable.length > 0)
      fail(
        "Garment feasible optimization has unavailable actual lift derivatives",
        current,
        model,
      );
    const solved: ReturnType<typeof solveAutoMovieQuadraticProgram> = solve(
      current,
      model,
      [...hard, ...model.rows],
      diagonal,
      new Array<number>(variables).fill(0),
      "optimization",
    );
    const next: number[] = target(solved.primal);
    if (!next.every(Number.isFinite))
      fail(
        "Garment affine optimization produced unavailable candidate coordinates",
        current,
        model,
      );
    const desiredMovement: number = next.reduce(
      (maximum: number, value: number, i: number): number =>
        Math.max(maximum, Math.abs(value - current.base[i])),
      0,
    );
    let step: number = 1;
    for (;;) {
      const base: number[] = between(current.base, next, step);
      const trial: IHumanBodyUnderwearSurfaceEvaluation | null = trialAt(
        base,
        "optimization",
        step,
        current,
        model,
      );
      const nextEnergy: number = objective(base);
      if (trial !== null && feasible(trial) && nextEnergy <= energy) {
        const movement: number = trial.base.reduce(
          (maximum: number, value: number, i: number): number =>
            Math.max(maximum, Math.abs(value - current.base[i])),
          0,
        );
        current = trial;
        energy = nextEnergy;
        if (movement <= resolution) {
          if (desiredMovement > resolution)
            fail(
              "Garment accepted movement reached representation resolution before its connected proposal converged",
              current,
              model,
            );
          return finish(current);
        }
        break;
      }
      if (trial !== null && feasible(trial) && !(nextEnergy <= energy))
        trialFailures.push({
          base,
          phase: "optimization",
          step,
          reason:
            "This feasible candidate did not decrease the original relative-edge objective.",
          geometryViolations: trial.violations,
          fieldResidualMetres: trial.fieldResidualMetres,
          edgeObjective: nextEnergy,
        });
      if (
        base.every(
          (value: number, i: number): boolean => value === current.base[i],
        )
      )
        fail(
          "Garment feasible energy globalization has no representable accepted step",
          trial ?? current,
          model,
        );
      step /= 2;
    }
  }
}
