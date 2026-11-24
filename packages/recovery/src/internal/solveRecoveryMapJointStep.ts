import type {
  IAutoMovieRecoveryMapDesignSolutionOperation,
  IAutoMovieRecoveryMapJointPreparation,
  IAutoMovieRecoveryMapJointStepSolutionOperation,
} from "@automovie/interface";

import { createRecoveryMapMetric } from "./createRecoveryMapMetric";
import { prepareRecoveryMapJointBlocks } from "./prepareRecoveryMapJointBlocks";
import { solveRecoveryMapDesign } from "./solveRecoveryMapDesign";

/**
 * Eliminate independent landmark coordinates from an original bundle design.
 * Point-local Givens QR retains the caller's gauge-fixed camera columns. This
 * is orthogonal variable elimination, avoiding the squared conditioning of a
 * normal-matrix Schur complement. Optional metric retention exposes
 * inverse/transpose actions from the same damped arrowhead design; the caller
 * separately admits and charges its factor.
 */
export function solveRecoveryMapJointStep(
  blocks: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[0],
  minimumRatio: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[1],
  damping: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[2],
  budget: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[3],
  retainMetric: Parameters<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation>[4] = false,
): ReturnType<IAutoMovieRecoveryMapJointStepSolutionOperation.Operation> {
  if (!(damping >= 0))
    throw new Error("camera-map: bounded joint blocks required");
  const prepared: IAutoMovieRecoveryMapJointPreparation =
    prepareRecoveryMapJointBlocks(blocks, minimumRatio, budget, true);
  const cameraWidth: number = prepared.cameraWidth;
  const cameraScales: number[] = prepared.cameraScales;
  const pointScales: number[][] = prepared.pointScales;
  const minimumPointDesignRatio: number = prepared.minimumPointDesignRatio;
  const gradient: number = prepared.gradient!;
  const eliminate: IAutoMovieRecoveryMapJointPreparation["eliminate"] =
    prepared.eliminate;
  const original: ReturnType<typeof eliminate> = eliminate(0);
  const qualified: ReturnType<IAutoMovieRecoveryMapDesignSolutionOperation.Operation> =
    solveRecoveryMapDesign(
      original.rows,
      original.right,
      minimumRatio,
      0,
      budget,
    );
  const damped: ReturnType<typeof eliminate> =
    damping > 0 ? eliminate(damping) : original;
  const solution: ReturnType<IAutoMovieRecoveryMapDesignSolutionOperation.Operation> =
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
