import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapElimination,
  IAutoMovieRecoveryMapJointBlock,
  IAutoMovieRecoveryMapJointPreparation,
  IAutoMovieRecoveryMapMetricFit,
} from "@automovie/interface";

import { createRecoveryMapMetric } from "../../internal/createRecoveryMapMetric";
import { factorRecoveryMapDesign } from "../../internal/factorRecoveryMapDesign";
import { prepareRecoveryMapJointBlocks } from "../../internal/prepareRecoveryMapJointBlocks";

/**
 * Build only the original-rank-qualified raw metric a feasible model uses. This
 * operation does not request an unconstrained LS answer or scaled gradient.
 */
export function factorRecoveryMapMetric(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  minimumRatio: number,
  damping: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapMetricFit {
  if (!(damping >= 0))
    throw new Error("camera-map: bounded joint blocks required");
  const prepared: IAutoMovieRecoveryMapJointPreparation =
    prepareRecoveryMapJointBlocks(blocks, minimumRatio, budget, false);
  const original: IAutoMovieRecoveryMapElimination = prepared.eliminate(0);
  const cameraDesignRatio: number = factorRecoveryMapDesign(
    original.rows,
    original.right,
    minimumRatio,
    budget,
  ).designRatio;
  const damped: IAutoMovieRecoveryMapElimination =
    damping > 0 ? prepared.eliminate(damping) : original;
  return {
    cameraDesignRatio,
    minimumPointDesignRatio: prepared.minimumPointDesignRatio,
    cameraScales: prepared.cameraScales,
    pointScales: prepared.pointScales,
    metric: createRecoveryMapMetric(
      damped.triangular,
      damped.rows,
      prepared.pointScales,
      prepared.cameraScales,
      budget,
    ),
  };
}
