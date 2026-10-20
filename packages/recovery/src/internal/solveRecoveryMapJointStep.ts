import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapJointStep } from "../structures/internal/IAutoMovieRecoveryMapJointStep";
import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapElimination } from "../structures/internal/IAutoMovieRecoveryMapElimination";
import { createRecoveryMapMetric } from "./createRecoveryMapMetric";
import { solveRecoveryMapDesign } from "./solveRecoveryMapDesign";

/**
 * Eliminate independent landmark coordinates from an original bundle design.
 * Point-local Givens QR retains the caller's gauge-fixed camera columns.
 * This is orthogonal variable elimination,
 * avoiding the squared conditioning of a normal-matrix Schur complement.
 * Optional metric retention exposes inverse/transpose actions from the same
 * damped arrowhead design; the caller separately admits and charges its factor.
 *
 * @evidence contracts/common.md#principled-implementation Every point's undamped three-column design and the undamped reduced camera design are independently rank checked. Identical point/camera column scaling and augmented damping define one full least-squares problem; orthogonal elimination and back substitution solve it without constructing a dense all-point design.
 * @evidence contracts/common.md#clear-and-simple-design The helper owns only the block linear step; observation derivatives, robust weighting, gauge construction and nonlinear acceptance stay with the joint optimizer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No damped rank, epsilon inverse, normal equations, dropped residual or separately normalized camera supplies observability. Unresolved point blocks or the reduced camera design throw before a step is returned.
 * @evidence contracts/common.md#meaningful-documentation States variable gauge-fixed camera coordinates, point-local elimination, consistent damping, unscaled returned steps and independent undamped rank diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms With E observations, L points and C admitted camera columns, point elimination costs O((E+L)*C); reduced QR/SVD costs O(E*C^2+S*C^3). Storage is O(E*C+L*C+C^2), avoiding a dense (C+3L)-column factorization. Actual variable-width sizes are admitted before allocations.
 * @evidence contracts/performance.md#reuse-equivalent-work Current weighted blocks supply global camera scales, per-point scales and both undamped qualification and damped elimination. The stored triangular block recovers each point step after one reduced camera solve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Camera/point steps and scalar diagnostics transfer. Explicit metric retention additionally holds O(L*C+C^2) owned current factors/scales for the feasible consumer; ordinary calls retain none. No borrowed observations, global cache or external handles remain.
 */
export function solveRecoveryMapJointStep(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  minimumRatio: number,
  damping: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
  retainMetric: boolean = false,
): IAutoMovieRecoveryMapJointStep {
  const totalRows: number = blocks.reduce(
    (sum: number, block: (typeof blocks)[number]): number =>
      sum + block.right.length,
    0,
  );
  const cameraWidth: number = blocks[0]?.cameraRows[0]?.length ?? 0;
  const localWidth: number = cameraWidth + 4;
  const maximumLocalEntries: number =
    blocks.reduce(
      (maximum: number, block: (typeof blocks)[number]): number =>
        Math.max(maximum, block.right.length + 3),
      totalRows,
    ) * localWidth;
  const maximumReducedEntries: number =
    (totalRows + 2 * cameraWidth) * cameraWidth;
  if (
    blocks.length < 1 ||
    cameraWidth < 1 ||
    !Number.isSafeInteger(maximumLocalEntries) ||
    !Number.isSafeInteger(maximumReducedEntries) ||
    maximumLocalEntries > budget.maxLinearEntries ||
    maximumReducedEntries > budget.maxLinearEntries ||
    !(damping >= 0) ||
    !Number.isFinite(damping)
  )
    throw new Error("camera-map: bounded joint blocks required");
  const cameraScales: number[] = new Array<number>(cameraWidth).fill(0);
  const pointScales: number[][] = [];
  let minimumPointDesignRatio: number = Infinity,
    gradient: number = 0;
  for (const block of blocks) {
    if (
      block.right.length < 4 ||
      block.right.length % 2 !== 0 ||
      block.pointRows.length !== block.right.length ||
      block.cameraRows.length !== block.right.length ||
      !block.right.every(Number.isFinite)
    )
      throw new Error(
        "camera-map: at least two complete observations per landmark required",
      );
    const scales: number[] = [0, 0, 0];
    for (let row: number = 0; row < block.right.length; row++) {
      if (
        block.pointRows[row]!.length !== 3 ||
        block.cameraRows[row]!.length !== cameraWidth ||
        ![...block.pointRows[row]!, ...block.cameraRows[row]!].every(
          Number.isFinite,
        )
      )
        throw new Error(
          "camera-map: finite point/camera Jacobian blocks required",
        );
      for (let column: number = 0; column < 3; column++)
        scales[column] = Math.hypot(
          scales[column]!,
          block.pointRows[row]![column]!,
        );
      for (let column: number = 0; column < cameraWidth; column++)
        cameraScales[column] = Math.hypot(
          cameraScales[column]!,
          block.cameraRows[row]![column]!,
        );
    }
    if (
      scales.some(
        (value: number): boolean => !(value > 0) || !Number.isFinite(value),
      )
    )
      throw new Error("camera-map: unresolved landmark direction");
    const pointRows: number[][] = block.pointRows.map(
      (row: number[]): number[] =>
        row.map((value: number, at: number): number => value / scales[at]!),
    );
    const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
      decomposeAutoMovieSingularMatrix(pointRows, {
        maxEntries: budget.maxLinearEntries,
        maxSweeps: budget.maxSingularSweeps,
        orthogonalityTolerance: 1e-12,
      });
    const ratio: number =
      factors.singularValues[2]! / factors.singularValues[0]!;
    if (!(ratio >= minimumRatio))
      throw new Error("camera-map: rank-degenerate landmark block");
    minimumPointDesignRatio = Math.min(minimumPointDesignRatio, ratio);
    for (let column: number = 0; column < 3; column++)
      gradient = Math.max(
        gradient,
        Math.abs(
          pointRows.reduce(
            (sum: number, row: number[], at: number): number =>
              sum + row[column]! * block.right[at]!,
            0,
          ),
        ),
      );
    pointScales.push(scales);
  }
  if (
    cameraScales.some(
      (value: number): boolean => !(value > 0) || !Number.isFinite(value),
    )
  )
    throw new Error("camera-map: unresolved joint camera direction");
  for (let column: number = 0; column < cameraWidth; column++) {
    let component: number = 0;
    for (const block of blocks)
      for (let row: number = 0; row < block.right.length; row++)
        component +=
          (block.cameraRows[row]![column]! / cameraScales[column]!) *
          block.right[row]!;
    gradient = Math.max(gradient, Math.abs(component));
  }
  const eliminate: (amount: number) => IAutoMovieRecoveryMapElimination = (
    amount: number,
  ): IAutoMovieRecoveryMapElimination => {
    const reduced: number[][] = [],
      right: number[] = [],
      triangular: number[][][] = [];
    for (let at: number = 0; at < blocks.length; at++) {
      const block: (typeof blocks)[number] = blocks[at]!;
      const rows: number[][] = block.right.map(
        (value: number, row: number): number[] => [
          ...block.pointRows[row]!.map(
            (entry: number, column: number): number =>
              entry / pointScales[at]![column]!,
          ),
          ...block.cameraRows[row]!.map(
            (entry: number, column: number): number =>
              entry / cameraScales[column]!,
          ),
          value,
        ],
      );
      if (amount > 0)
        for (let column: number = 0; column < 3; column++)
          rows.push(
            Array.from(
              { length: localWidth },
              (_: unknown, index: number): number =>
                index === column ? Math.sqrt(amount) : 0,
            ),
          );
      for (let column: number = 0; column < 3; column++)
        for (let row: number = rows.length - 1; row > column; row--) {
          const a: number = rows[column]![column]!,
            b: number = rows[row]![column]!;
          if (b === 0) continue;
          const norm: number = Math.hypot(a, b),
            cosine: number = a / norm,
            sine: number = b / norm;
          for (let index: number = column; index < localWidth; index++) {
            const first: number = rows[column]![index]!,
              second: number = rows[row]![index]!;
            rows[column]![index] = cosine * first + sine * second;
            rows[row]![index] = -sine * first + cosine * second;
          }
        }
      triangular.push(rows.slice(0, 3));
      for (const row of rows.slice(3)) {
        reduced.push(row.slice(3, 3 + cameraWidth));
        right.push(row[3 + cameraWidth]!);
      }
    }
    if (amount > 0)
      for (let row: number = 0; row < cameraWidth; row++) {
        reduced.push(
          Array.from(
            { length: cameraWidth },
            (_: unknown, column: number): number =>
              column === row ? Math.sqrt(amount) : 0,
          ),
        );
        right.push(0);
      }
    return { rows: reduced, right, triangular };
  };
  const original: ReturnType<typeof eliminate> = eliminate(0);
  const qualified: ReturnType<typeof solveRecoveryMapDesign> =
    solveRecoveryMapDesign(
      original.rows,
      original.right,
      minimumRatio,
      0,
      budget,
    );
  const damped: ReturnType<typeof eliminate> =
    damping > 0 ? eliminate(damping) : original;
  const solution: ReturnType<typeof solveRecoveryMapDesign> =
    damping > 0
      ? solveRecoveryMapDesign(damped.rows, damped.right, 0, 0, budget)
      : qualified;
  const cameraStep: number[] = solution.step.map(
    (value: number, at: number): number => value / cameraScales[at]!,
  );
  const pointSteps: [number, number, number][] = damped.triangular.map(
    (rows: number[][], at: number): [number, number, number] => {
      const scaled: number[] = [0, 0, 0];
      for (let row: number = 2; row >= 0; row--) {
        let right: number = rows[row]![3 + cameraWidth]!;
        for (let column: number = 0; column < cameraWidth; column++)
          right -= rows[row]![3 + column]! * solution.step[column]!;
        for (let column: number = row + 1; column < 3; column++)
          right -= rows[row]![column]! * scaled[column]!;
        scaled[row] = right / rows[row]![row]!;
      }
      return scaled.map(
        (value: number, column: number): number =>
          value / pointScales[at]![column]!,
      ) as [number, number, number];
    },
  );
  if (![...cameraStep, ...pointSteps.flat(), gradient].every(Number.isFinite))
    throw new Error("camera-map: nonrepresentable joint step");
  return {
    cameraStep,
    pointSteps,
    cameraDesignRatio: qualified.designRatio,
    minimumPointDesignRatio,
    gradient,
    ...(retainMetric
      ? {
          metric: createRecoveryMapMetric(
            damped.triangular,
            damped.rows,
            pointScales,
            cameraScales,
            budget,
          ),
        }
      : {}),
  };
}
