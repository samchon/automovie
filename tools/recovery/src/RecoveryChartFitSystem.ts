import type { RecoveryChartFit } from "./RecoveryChartFit.ts";
import type { RecoveryChartFitPrepare } from "./RecoveryChartFitPrepare.ts";
import { RecoveryChartFitRows as O } from "./RecoveryChartFitRows.ts";

type Input = RecoveryChartFit.Input;

/**
 * Assemble the same sparse weighted system and its bounded rank diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Observation order, one unordered reciprocal Gram product, two-pass QR and original pivot ties remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Assembly follows reduced row stencils; QR and Gram diagnostics retain their 512-control and scalar-work limits.
 * @evidence contracts/performance.md#reuse-equivalent-work The same sparse Gram entries and diagonal are shared by rank diagnostics and the box solve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sparse maps and bounded dense diagnostic scratch remain local to one fit; retained system arrays transfer to the solver phase.
 */
export function RecoveryChartFitSystem(
  input: Input,
  prepared: ReturnType<typeof RecoveryChartFitPrepare>,
): {
  diagonal: Float64Array;
  hessian: Map<number, number>[];
  rhs: Float64Array;
  maximumRowTerms: number;
  physicalJetRows: number;
  leastSquaresConstant: number;
  diagnostics: string[];
  unseen: number;
  dataRowRank: number | null;
  dataQrDiagonalRatio: number | null;
  rankTolerance: number;
  observationRank: number | null;
  gramPivotRatio: number | null;
} {
  const {
    finite,
    lower,
    upper,
    origin,
    scale,
    slots,
    maximumRowBudget,
    reduced,
    unknowns,
    normalizedConstants,
    totalWeight,
  }: ReturnType<typeof RecoveryChartFitPrepare> = prepared;
  const diagonal: Float64Array = new Float64Array(unknowns);
  const hessian: Map<number, number>[] = Array.from(
    { length: unknowns },
    (): Map<number, number> => new Map(),
  );
  const rhs: Float64Array = new Float64Array(3 * unknowns);
  let maximumRowTerms: number = 0,
    physicalJetRows: number = 0,
    leastSquaresConstant: number = 0;
  for (const sample of input.observations) {
    if (
      !Number.isSafeInteger(sample.patch) ||
      sample.patch < 0 ||
      sample.patch >= input.patches.length ||
      !finite(sample.pointMm) ||
      sample.pointMm.some(
        (x: number, k: number): boolean => x < lower[k]! || x > upper[k]!,
      ) ||
      !(sample.weight > 0 && Number.isFinite(sample.weight)) ||
      !Number.isFinite(sample.u) ||
      !Number.isFinite(sample.v) ||
      sample.u < 0 ||
      sample.u > 1 ||
      sample.v < 0 ||
      sample.v > 1
    )
      throw new Error("Finite chart-local point correspondences are required");
    for (const row of O(sample)) {
      if (row.kind === "physical-gradient") physicalJetRows++;
      const terms: Map<number, number> = new Map();
      const target: number[] = row.targetMm.map(
        (value: number, k: number): number =>
          (value - origin[k]! * row.mass) / scale,
      );
      for (let at: number = 0; at < 16; at++) {
        const id: number = input.patches[sample.patch]!.controlIds[at]!,
          value: number = row.coefficients[at]!;
        for (const term of reduced.expressions[id]!.terms) {
          const slot: number = slots[term.id]!;
          terms.set(slot, (terms.get(slot) ?? 0) + value * term.weight);
        }
        for (let k: number = 0; k < 3; k++)
          target[k] -= value * normalizedConstants[id]![k]!;
      }
      const ids: number[] = [...terms.keys()],
        values: number[] = [...terms.values()],
        weight: number = sample.weight / totalWeight;
      maximumRowTerms = Math.max(maximumRowTerms, ids.length);
      if (maximumRowTerms > maximumRowBudget)
        throw new Error(
          "Reduced observation stencil exceeds its explicit assembly-work budget",
        );
      if (!(weight > 0))
        throw new Error(
          "An observation weight cannot be represented after normalization",
        );
      leastSquaresConstant +=
        0.5 *
        weight *
        target.reduce(
          (sum: number, value: number): number => sum + value * value,
          0,
        );
      for (let i: number = 0; i < ids.length; i++) {
        const id: number = ids[i]!,
          value: number = values[i]!;
        for (let k: number = 0; k < 3; k++)
          rhs[3 * id + k] += weight * value * target[k]!;
        // One unordered product supplies both reciprocal Gram entries bit for bit.
        for (let j: number = i; j < ids.length; j++) {
          const other: number = ids[j]!,
            contribution: number = weight * value * values[j]!;
          const next: number = (hessian[id]!.get(other) ?? 0) + contribution;
          hessian[id]!.set(other, next);
          if (other !== id) hessian[other]!.set(id, next);
        }
      }
    }
  }
  hessian.forEach((row: Map<number, number>, i: number): void => {
    diagonal[i] = row.get(i) ?? 0;
  });
  const diagnostics: string[] = [
    "Numerical normal-equation rank is not an exact rank or continuous source-distance certificate; chart injectivity remains separate.",
  ];
  const unseen: number = [...diagonal].filter(
    (x: number): boolean => x === 0,
  ).length;
  if (unseen)
    diagnostics.push(
      `${unseen} unknown controls have no nonzero observation basis support`,
    );
  // A separate data-row calculation avoids inferring data conditioning from H=A^TWA.
  const orthogonal: Float64Array[] = [];
  let qrWork: number = 0,
    qrMaximum: number = 0,
    qrMinimum: number = Infinity,
    dataRowRank: number | null = 0;
  const qrTolerance: number =
    Number.EPSILON *
    Math.max(1, unknowns, input.observations.length + physicalJetRows);
  rankRows: for (const sample of unknowns > 512 ? [] : input.observations)
    for (const row of O(sample)) {
      if (orthogonal.length === unknowns) break rankRows;
      if (qrWork + 4 * unknowns * orthogonal.length > 50_000_000) {
        dataRowRank = null;
        break rankRows;
      }
      const vector: Float64Array = new Float64Array(unknowns),
        weight: number = Math.sqrt(sample.weight / totalWeight);
      for (let at: number = 0; at < 16; at++) {
        const id: number = input.patches[sample.patch]!.controlIds[at]!;
        for (const term of reduced.expressions[id]!.terms) {
          const slot: number = slots[term.id]!;
          if (diagonal[slot]! > 0)
            vector[slot] +=
              (weight * row.coefficients[at]! * term.weight) /
              Math.sqrt(diagonal[slot]!);
        }
      }
      const initial: number = Math.hypot(...vector);
      qrMaximum = Math.max(qrMaximum, initial);
      for (let pass: number = 0; pass < 2; pass++)
        for (const q of orthogonal) {
          let dot: number = 0;
          for (let i: number = 0; i < unknowns; i++) dot += q[i]! * vector[i]!;
          for (let i: number = 0; i < unknowns; i++) vector[i] -= dot * q[i]!;
          qrWork += 2 * unknowns;
        }
      const length: number = Math.hypot(...vector);
      if (length > qrTolerance * qrMaximum) {
        qrMinimum = Math.min(qrMinimum, length);
        orthogonal.push(
          Float64Array.from(vector, (value: number): number => value / length),
        );
      }
      dataRowRank = orthogonal.length;
    }
  if (unknowns > 512) dataRowRank = null;
  const dataQrDiagonalRatio: number | null =
    dataRowRank === null
      ? null
      : unknowns === 0
        ? 1
        : qrMaximum > 0 && orthogonal.length > 0
          ? qrMinimum / qrMaximum
          : 0;
  if (dataRowRank === null)
    diagnostics.push(
      unknowns > 512
        ? "Column-scaled data-row QR exceeds its 512-control workspace budget"
        : "Column-scaled data-row QR exceeded its 50000000 scalar-projection-operation budget",
    );
  else if (dataRowRank !== unknowns)
    diagnostics.push(
      `Numerical column-scaled data-row rank ${dataRowRank} is below ${unknowns} unknown controls`,
    );
  const rankTolerance: number =
    Number.EPSILON *
    Math.max(1, unknowns, input.observations.length + physicalJetRows);
  let observationRank: number | null = unknowns === 0 ? 0 : null,
    gramPivotRatio: number | null = unknowns === 0 ? 1 : null;
  if (unknowns > 0 && unknowns <= 512) {
    const residual: Float64Array = diagonal.slice(),
      factors: Float64Array[] = Array.from(
        { length: unknowns },
        (): Float64Array => new Float64Array(unknowns),
      ),
      selected: Set<number> = new Set();
    const largest: number = Math.max(...diagonal);
    let smallest: number = largest;
    observationRank = 0;
    for (let column: number = 0; column < unknowns; column++) {
      let pivot: number = -1;
      for (let i: number = 0; i < unknowns; i++)
        if (!selected.has(i) && (pivot < 0 || residual[i]! > residual[pivot]!))
          pivot = i;
      if (pivot < 0 || !(residual[pivot]! > rankTolerance * largest)) break;
      const value: number = residual[pivot]!;
      smallest = Math.min(smallest, value);
      selected.add(pivot);
      observationRank++;
      factors[pivot]![column] = Math.sqrt(value);
      for (let i: number = 0; i < unknowns; i++)
        if (!selected.has(i)) {
          let entry: number = hessian[i]!.get(pivot) ?? 0;
          for (let j: number = 0; j < column; j++)
            entry -= factors[i]![j]! * factors[pivot]![j]!;
          const factor: number = entry / factors[pivot]![column]!;
          factors[i]![column] = factor;
          residual[i] -= factor * factor;
        }
    }
    gramPivotRatio =
      largest > 0 && observationRank > 0 ? smallest / largest : 0;
  }
  if (observationRank === null)
    diagnostics.push(
      "Observation rank diagnostic exceeds its 512-control dense workspace budget",
    );
  else if (observationRank !== unknowns)
    diagnostics.push(
      `Numerical observation rank ${observationRank} is below ${unknowns} unknown controls`,
    );

  return {
    diagonal,
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
  };
}
