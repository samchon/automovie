import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapJointPreparation } from "../structures/internal/IAutoMovieRecoveryMapJointPreparation";
import type { IAutoMovieRecoveryMapElimination } from "../structures/internal/IAutoMovieRecoveryMapElimination";

/**
 * Prepare original point qualification and one current scaled block design.
 *
 * @evidence contracts/common.md#principled-implementation Original positive column norms and undamped point SVDs precede point-first Givens elimination. Step and metric consumers use identical row order, global camera/point scales and damping coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Shared preparation exposes an admitted elimination action and optional scaled-gradient measurement; full LS solving and rank-only metric consumption remain separate operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rank is inferred from damping, no row is dropped, and an unrequested gradient is explicitly null rather than false stationarity.
 * @evidence contracts/common.md#meaningful-documentation Inputs are borrowed numeric blocks; original step consumers request the unchanged gradient loops while metric consumers skip them. The action accepts only finite nonnegative caller-admitted damping.
 * @evidence contracts/performance.md#efficient-algorithms Original scale/point-rank work costs O(E*C+S*E); each point elimination costs O((E+L)*C). Original entry bounds precede numerical allocation, and the caller retains its conservative full-model charge.
 * @evidence contracts/performance.md#reuse-equivalent-work One set of current global scales and original point qualifications serves both zero and damped eliminations without a second derivative pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned O(C+L) scales and a closure borrowing current blocks live for one operation. Original/damped arrays remain under the existing model reserve; only explicitly selected metric factors transfer, never this preparation or its closure.
 */
export function prepareRecoveryMapJointBlocks(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  minimumRatio: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
  measureGradient: boolean,
): IAutoMovieRecoveryMapJointPreparation {
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
    maximumReducedEntries > budget.maxLinearEntries
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
    if (measureGradient) {
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
    }
    pointScales.push(scales);
  }
  if (
    cameraScales.some(
      (value: number): boolean => !(value > 0) || !Number.isFinite(value),
    )
  )
    throw new Error("camera-map: unresolved joint camera direction");
  if (measureGradient) {
    for (let column: number = 0; column < cameraWidth; column++) {
      let component: number = 0;
      for (const block of blocks)
        for (let row: number = 0; row < block.right.length; row++)
          component +=
            (block.cameraRows[row]![column]! / cameraScales[column]!) *
            block.right[row]!;
      gradient = Math.max(gradient, Math.abs(component));
    }
  }
  const eliminate: (amount: number) => IAutoMovieRecoveryMapElimination = (
    amount: number,
  ): IAutoMovieRecoveryMapElimination => {
    if (!(amount >= 0) || !Number.isFinite(amount))
      throw new Error("camera-map: admitted finite elimination damping required");
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
  return { cameraWidth, cameraScales, pointScales, minimumPointDesignRatio,
    gradient: measureGradient ? gradient : null, eliminate };
}
