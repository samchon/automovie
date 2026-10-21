import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapJointStep } from "../structures/internal/IAutoMovieRecoveryMapJointStep";
import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapJointPreparation } from "../structures/internal/IAutoMovieRecoveryMapJointPreparation";
import { prepareRecoveryMapJointBlocks } from "./prepareRecoveryMapJointBlocks";
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
 * @evidence contracts/common.md#clear-and-simple-design Shared current-block preparation serves this complete LS operation and a separate rank/metric-only operation. This API still computes all requested steps and its scaled gradient; geometric acceptance stays with the optimizer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No damped rank, epsilon inverse, normal equations, dropped residual or separately normalized camera supplies observability. Unresolved point blocks or the reduced camera design throw before a step is returned.
 * @evidence contracts/common.md#meaningful-documentation States variable gauge-fixed camera coordinates, point-local elimination, consistent damping, unscaled returned steps and independent undamped rank diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms With E observations, L points and C admitted camera columns, point elimination costs O((E+L)*C); reduced QR/SVD costs O(E*C^2+S*C^3). Storage is O(E*C+L*C+C^2), avoiding a dense (C+3L)-column factorization. Actual variable-width sizes are admitted before allocations.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared preparation preserves original per-point scale/SVD/gradient order and serves both undamped and damped elimination. Stored triangles recover all point steps after the same reduced camera solve; no cross-state answer is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Camera/point steps and scalar diagnostics transfer. Explicit metric retention additionally holds O(L*C+C^2) owned current factors/scales for the feasible consumer; ordinary calls retain none. No borrowed observations, global cache or external handles remain.
 */
export function solveRecoveryMapJointStep(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  minimumRatio: number,
  damping: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
  retainMetric: boolean = false,
): IAutoMovieRecoveryMapJointStep {
  if (!(damping >= 0) || !Number.isFinite(damping))
    throw new Error("camera-map: bounded joint blocks required");
  const prepared: IAutoMovieRecoveryMapJointPreparation = prepareRecoveryMapJointBlocks(blocks, minimumRatio, budget, true);
  const cameraWidth: number = prepared.cameraWidth;
  const cameraScales: number[] = prepared.cameraScales;
  const pointScales: number[][] = prepared.pointScales;
  const minimumPointDesignRatio: number = prepared.minimumPointDesignRatio;
  const gradient: number = prepared.gradient!;
  const eliminate: IAutoMovieRecoveryMapJointPreparation["eliminate"] = prepared.eliminate;
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
