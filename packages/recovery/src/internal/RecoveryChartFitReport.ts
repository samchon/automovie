import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartControlRelations,
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitReport,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "@automovie/interface";

import { RecoveryChartFitRows as O } from "./RecoveryChartFitRows";
import { RecoveryChartReachableBox as W } from "./RecoveryChartReachableBox";

/**
 * Measure residuals, the first strict worst witness and optimality from the
 * solved chart.
 */
export function RecoveryChartFitReport(
  input: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[0],
  prepared: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[1],
  system: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[2],
  solution: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[3],
): ReturnType<IAutoMovieRecoveryChartFitReport.Operation> {
  const {
    finite,
    lower,
    upper,
    origin,
    scale,
    slots,
    reduced,
    unknowns,
    maximumRowBudget,
    totalWeight,
    basis,
  }: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> = prepared;
  const {
    hessian,
    rhs,
    maximumRowTerms,
    physicalJetRows,
    leastSquaresConstant,
    diagnostics,
    unseen,
    dataRowRank,
    dataQrDiagonalRatio,
    rankTolerance,
    observationRank,
    gramPivotRatio,
  }: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation> = system;
  const {
    lo,
    hi,
    solved,
    x,
    iterations,
    projectedGradient,
    controls,
    dependentEnclosureViolationMm,
  }: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation> = solution;
  let squared: number = 0,
    maximumMm: number = 0,
    fixedSupportMaximumMm: number = 0,
    freeSupportMaximumMm: number = 0;
  let maximumLocation: IAutoMovieRecoveryChartFit.Result["maximumLocation"] =
    null;
  let maximumSample:
    | NonNullable<IAutoMovieRecoveryChartFit.Input["validation"]>[number]
    | null = null;
  const patchMaximumMm: number[] = input.patches.map((): number => 0);
  const patchMaximumLocations: IAutoMovieRecoveryChartFit.Result["patchMaximumLocations"] =
    input.patches.map((): null => null);
  const patchFreeSupportMaximumMm: number[] = input.patches.map(
    (): number => 0,
  );
  const residual: (
    sample: NonNullable<IAutoMovieRecoveryChartFit.Input["validation"]>[number],
  ) => number = (
    sample: NonNullable<IAutoMovieRecoveryChartFit.Input["validation"]>[number],
  ): number => {
    if (
      sample.patch < 0 ||
      sample.patch >= input.patches.length ||
      !finite(sample.pointMm) ||
      sample.u < 0 ||
      sample.u > 1 ||
      sample.v < 0 ||
      sample.v > 1
    )
      throw new Error(
        "Finite chart-local validation correspondences are required",
      );
    const u: number[] = basis(sample.u),
      v: number[] = basis(sample.v),
      point: number[] = [0, 0, 0];
    let freeSupport: boolean = false;
    for (let j: number = 0; j < 4; j++)
      for (let i: number = 0; i < 4; i++) {
        const id: number = input.patches[sample.patch]!.controlIds[4 * j + i]!,
          p: Readonly<AutoMovieVector3Tuple> = controls[id]!;
        if (u[i]! * v[j]! > 0 && reduced.expressions[id]!.terms.length > 0)
          freeSupport = true;
        for (let k: number = 0; k < 3; k++)
          point[k] += u[i]! * v[j]! * (p[k]! - origin[k]!);
      }
    const distance: number = Math.hypot(
      ...point.map(
        (value: number, k: number): number =>
          value + origin[k]! - sample.pointMm[k]!,
      ),
    );
    if (distance > patchMaximumMm[sample.patch]!) {
      patchMaximumMm[sample.patch] = distance;
      patchMaximumLocations[sample.patch] = [sample.u, sample.v];
    }
    if (distance > maximumMm) {
      maximumMm = distance;
      maximumLocation = {
        patch: sample.patch,
        u: sample.u,
        v: sample.v,
        fixedSupport: !freeSupport,
      };
      maximumSample = sample;
    }
    if (freeSupport) {
      freeSupportMaximumMm = Math.max(freeSupportMaximumMm, distance);
      patchFreeSupportMaximumMm[sample.patch] = Math.max(
        patchFreeSupportMaximumMm[sample.patch]!,
        distance,
      );
    } else fixedSupportMaximumMm = Math.max(fixedSupportMaximumMm, distance);
    return distance;
  };
  let jetSquared: number = 0;
  for (const sample of input.observations) {
    const distance: number = residual(sample);
    squared += (sample.weight / totalWeight) * distance ** 2;
    if (sample.physicalJet)
      for (const row of O(sample))
        if (row.kind === "physical-gradient") {
          const value: number[] = origin.map(
            (coordinate: number): number => coordinate * row.mass,
          );
          for (let at: number = 0; at < 16; at++)
            for (let k: number = 0; k < 3; k++)
              value[k] +=
                row.coefficients[at]! *
                (controls[input.patches[sample.patch]!.controlIds[at]!]![k]! -
                  origin[k]!);
          jetSquared +=
            (sample.weight / totalWeight) *
            value.reduce(
              (sum: number, coordinate: number, k: number): number =>
                sum + (coordinate - row.targetMm[k]!) ** 2,
              0,
            );
        }
  }
  for (const sample of input.validation ?? []) residual(sample);
  if (projectedGradient > input.gradientTolerance)
    diagnostics.push("Projected-gradient work budget exhausted");
  if (maximumMm > input.toleranceMm)
    diagnostics.push(
      "Supplied chart correspondences exceed the requested residual",
    );
  const activeEnclosureControls: number = Array.from(
    { length: unknowns },
    (_: unknown, i: number): boolean =>
      [0, 1, 2].some(
        (k: number): boolean =>
          x[3 * i + k] === lo[k] || x[3 * i + k] === hi[k],
      ),
  ).filter(Boolean).length;
  let maximumWitness: IAutoMovieRecoveryChartFit.Result["maximumWitness"] =
    null;
  if (maximumSample) {
    const sample: NonNullable<
      IAutoMovieRecoveryChartFit.Input["validation"]
    >[number] = maximumSample;
    const patch: IAutoMovieRecoveryChartFit.Input["patches"][number] =
      input.patches[sample.patch]!;
    const u: number[] = basis(sample.u),
      v: number[] = basis(sample.v);
    const coefficients: number[] = Array.from(
      { length: 16 },
      (_: unknown, at: number): number => u[at % 4]! * v[Math.floor(at / 4)]!,
    );
    const terms: Map<number, number> = new Map(),
      constantMm: [number, number, number] = [0, 0, 0],
      fittedPointMm: [number, number, number] = [0, 0, 0];
    for (let at: number = 0; at < 16; at++) {
      const id: number = patch.controlIds[at]!,
        coefficient: number = coefficients[at]!;
      for (let k: number = 0; k < 3; k++) {
        constantMm[k] += coefficient * reduced.expressions[id]!.constant[k]!;
        fittedPointMm[k] += coefficient * controls[id]![k]!;
      }
      for (const term of reduced.expressions[id]!.terms)
        terms.set(
          term.id,
          (terms.get(term.id) ?? 0) + coefficient * term.weight,
        );
    }
    const row: {
      id: number;
      weight: number;
      valueMm: Readonly<AutoMovieVector3Tuple>;
    }[] = [...terms].map(
      ([id, weight]: [number, number]): {
        id: number;
        weight: number;
        valueMm: Readonly<AutoMovieVector3Tuple>;
      } => ({
        id,
        weight,
        valueMm: [
          origin[0]! + scale * x[3 * slots[id]!]!,
          origin[1]! + scale * x[3 * slots[id]! + 1]!,
          origin[2]! + scale * x[3 * slots[id]! + 2]!,
        ],
      }),
    );
    const bounds: readonly [number, number, number, number] | null =
      patch.parameterBounds ?? null;
    const patchRows: IAutoMovieRecoveryChartFit.Input["observations"][number][] =
      input.observations.filter(
        (
          row: IAutoMovieRecoveryChartFit.Input["observations"][number],
        ): boolean => row.patch === sample.patch,
      );
    const sampledRows: NonNullable<
      IAutoMovieRecoveryChartFit.Result["maximumWitness"]
    >["sampledRows"] = Array.from(
      { length: Math.min(17, patchRows.length) },
      (
        _: unknown,
        i: number,
      ): NonNullable<
        IAutoMovieRecoveryChartFit.Result["maximumWitness"]
      >["sampledRows"][number] => {
        const row: IAutoMovieRecoveryChartFit.Input["observations"][number] =
          patchRows[
            Math.floor((i * patchRows.length) / Math.min(17, patchRows.length))
          ]!;
        return {
          u: row.u,
          v: row.v,
          targetMm: [...row.pointMm],
          physicalJet: row.physicalJet ?? null,
        };
      },
    );
    const coefficientExpressions: NonNullable<
      IAutoMovieRecoveryChartFit.Result["maximumWitness"]
    >["coefficientExpressions"] = patch.controlIds.map(
      (
        id: number,
      ): NonNullable<
        IAutoMovieRecoveryChartFit.Result["maximumWitness"]
      >["coefficientExpressions"][number] => ({
        constant: [...reduced.expressions[id]!.constant],
        terms: reduced.expressions[id]!.terms.map(
          (term: {
            id: number;
            weight: number;
          }): { id: number; weight: number } => ({ ...term }),
        ),
      }),
    );
    maximumWitness = {
      patch: sample.patch,
      patchId: patch.id ?? null,
      localUV: [sample.u, sample.v],
      globalUV: bounds
        ? [
            bounds[0] + sample.u * (bounds[1] - bounds[0]),
            bounds[2] + sample.v * (bounds[3] - bounds[2]),
          ]
        : null,
      leafBounds: bounds,
      targetMm: [...sample.pointMm],
      fittedPointMm,
      controlIds: [...patch.controlIds],
      controlsMm: patch.controlIds.map(
        (id: number): Readonly<AutoMovieVector3Tuple> => [...controls[id]!],
      ),
      coefficients,
      coefficientExpressions,
      sampledRows,
      constantMm,
      terms: row,
      lowerMm: [...lower],
      upperMm: [...upper],
      reachable: W({
        constantMm,
        terms: row,
        lowerMm: lower,
        upperMm: upper,
        targetMm: sample.pointMm,
        toleranceMm: input.toleranceMm,
        maxTerms: maximumRowBudget,
      }),
      originalSourceFace: null,
    };
  }
  let boxSupportGap: number = 0,
    gradientInfinity: number = 0;
  for (let i: number = 0; i < unknowns; i++)
    for (let k: number = 0; k < 3; k++) {
      let product: number = 0;
      for (const [j, coefficient] of hessian[i]!)
        product += coefficient * x[3 * j + k]!;
      const gradient: number = product - rhs[3 * i + k]!,
        value: number = x[3 * i + k]!;
      gradientInfinity = Math.max(gradientInfinity, Math.abs(gradient));
      boxSupportGap -= Math.min(
        gradient * (lo[k]! - value),
        gradient * (hi[k]! - value),
      );
    }
  const optimality: IAutoMovieRecoveryChartFit.Result["optimality"] = {
    objective: solved.objective,
    leastSquaresConstant,
    boxSupportGap,
    gradientInfinity,
    physicalObjectiveGapUpperMm2: 2 * scale * scale * boxSupportGap,
    normalizationScaleMm: scale,
    normalizationOriginMm: [origin[0]!, origin[1]!, origin[2]!],
  };
  const {
    maximumTerms,
    maximumDepth,
    minimumWeight,
    maximumWeightSumError,
  }: ReturnType<IAutoMovieRecoveryChartControlRelations.Operation> = reduced;
  return {
    controls,
    qualified:
      dependentEnclosureViolationMm === 0 &&
      observationRank === unknowns &&
      dataRowRank === unknowns &&
      projectedGradient <= input.gradientTolerance &&
      maximumMm <= input.toleranceMm,
    iterations,
    projectedGradient,
    rmsMm: Math.sqrt(squared),
    physicalJetRmsMm: Math.sqrt(jetSquared),
    objectiveRmsMm: Math.sqrt(squared + jetSquared),
    physicalJetRows,
    solve: {
      originalLipschitz: solved.originalLipschitz,
      scaledLipschitz: solved.scaledLipschitz,
      minimumPositiveDiagonal: solved.minimumPositiveDiagonal,
      maximumDiagonal: solved.maximumDiagonal,
      restarts: solved.restarts,
    },
    maximumMm,
    maximumWitness,
    optimality,
    unknownControls: unknowns,
    observationRank,
    rankTolerance,
    gramPivotRatio,
    dataRowRank,
    dataQrDiagonalRatio,
    patchMaximumMm,
    patchFreeSupportMaximumMm,
    patchMaximumLocations,
    unsupportedControls: unseen,
    fixedSupportMaximumMm,
    freeSupportMaximumMm,
    maximumLocation,
    activeEnclosureControls,
    dependentEnclosureViolationMm,
    relationDiagnostics: {
      maximumTerms,
      maximumDepth,
      minimumWeight,
      maximumWeightSumError,
    },
    maximumRowTerms,
    hessianNonzeros: hessian.reduce(
      (sum: number, row: Map<number, number>): number => sum + row.size,
      0,
    ),
    diagnostics,
  };
}
