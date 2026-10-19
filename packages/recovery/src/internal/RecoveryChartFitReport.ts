import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import { RecoveryChartControlRelations as R } from "./RecoveryChartControlRelations";
import type { RecoveryChartFit } from "./RecoveryChartFit";
import type { RecoveryChartFitPrepare } from "./RecoveryChartFitPrepare";
import { RecoveryChartFitRows as O } from "./RecoveryChartFitRows";
import type { RecoveryChartFitSolve } from "./RecoveryChartFitSolve";
import type { RecoveryChartFitSystem } from "./RecoveryChartFitSystem";
import { RecoveryChartReachableBox as W } from "./RecoveryChartReachableBox";

type Input = RecoveryChartFit.Input;
type Result = RecoveryChartFit.Result;
/**
 * Measure residuals, the first strict worst witness and optimality from the solved chart.
 *
 * @evidence contracts/common.md#principled-implementation Observations precede validation, strict greater-than ties retain their first witness, and objective reductions keep their original order.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits supplied observations and validation, bounded witness samples and stored sparse system entries.
 * @evidence contracts/performance.md#reuse-equivalent-work Reports reuse the solved coefficients and normalized system without another fit or source lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the existing result and bounded worst-witness records escape; scratch remains owned by the fit call.
 */
export function RecoveryChartFitReport(
  input: Input,
  prepared: ReturnType<typeof RecoveryChartFitPrepare>,
  system: ReturnType<typeof RecoveryChartFitSystem>,
  solution: ReturnType<typeof RecoveryChartFitSolve>,
): Result {
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
  }: ReturnType<typeof RecoveryChartFitPrepare> = prepared;
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
  }: ReturnType<typeof RecoveryChartFitSystem> = system;
  const {
    lo,
    hi,
    solved,
    x,
    iterations,
    projectedGradient,
    controls,
    dependentEnclosureViolationMm,
  }: ReturnType<typeof RecoveryChartFitSolve> = solution;
  let squared: number = 0,
    maximumMm: number = 0,
    fixedSupportMaximumMm: number = 0,
    freeSupportMaximumMm: number = 0;
  let maximumLocation: Result["maximumLocation"] = null;
  let maximumSample: NonNullable<Input["validation"]>[number] | null = null;
  const patchMaximumMm: number[] = input.patches.map((): number => 0);
  const patchMaximumLocations: Result["patchMaximumLocations"] =
    input.patches.map((): null => null);
  const patchFreeSupportMaximumMm: number[] = input.patches.map(
    (): number => 0,
  );
  const residual: (
    sample: NonNullable<Input["validation"]>[number],
  ) => number = (sample: NonNullable<Input["validation"]>[number]): number => {
    if (
      !Number.isSafeInteger(sample.patch) ||
      sample.patch < 0 ||
      sample.patch >= input.patches.length ||
      !finite(sample.pointMm) ||
      !Number.isFinite(sample.u) ||
      !Number.isFinite(sample.v) ||
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
          p: C.Vector = controls[id]!;
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
  let maximumWitness: Result["maximumWitness"] = null;
  if (maximumSample) {
    const sample: NonNullable<Input["validation"]>[number] = maximumSample;
    const patch: Input["patches"][number] = input.patches[sample.patch]!;
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
    const row: { id: number; weight: number; valueMm: C.Vector }[] = [
      ...terms,
    ].map(
      ([id, weight]: [number, number]): {
        id: number;
        weight: number;
        valueMm: C.Vector;
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
    const patchRows: Input["observations"][number][] =
      input.observations.filter(
        (row: Input["observations"][number]): boolean =>
          row.patch === sample.patch,
      );
    const sampledRows: NonNullable<Result["maximumWitness"]>["sampledRows"] =
      Array.from(
        { length: Math.min(17, patchRows.length) },
        (
          _: unknown,
          i: number,
        ): NonNullable<Result["maximumWitness"]>["sampledRows"][number] => {
          const row: Input["observations"][number] =
            patchRows[
              Math.floor(
                (i * patchRows.length) / Math.min(17, patchRows.length),
              )
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
      Result["maximumWitness"]
    >["coefficientExpressions"] = patch.controlIds.map(
      (
        id: number,
      ): NonNullable<
        Result["maximumWitness"]
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
        (id: number): C.Vector => [...controls[id]!],
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
  const optimality: Result["optimality"] = {
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
  }: ReturnType<typeof R> = reduced;
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
