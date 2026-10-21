import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapJointPreparation } from "../structures/internal/IAutoMovieRecoveryMapJointPreparation";
import type { IAutoMovieRecoveryMapElimination } from "../structures/internal/IAutoMovieRecoveryMapElimination";
import type { IAutoMovieRecoveryMapMetricFit } from "../structures/internal/IAutoMovieRecoveryMapMetricFit";
import { createRecoveryMapMetric } from "./createRecoveryMapMetric";
import { factorRecoveryMapDesign } from "./factorRecoveryMapDesign";
import { prepareRecoveryMapJointBlocks } from "./prepareRecoveryMapJointBlocks";

/**
 * Build only the original-rank-qualified raw metric a feasible model uses.
 * This operation does not request an unconstrained LS answer or scaled gradient.
 *
 * @evidence contracts/common.md#principled-implementation Original point SVDs and the unchanged normalized undamped reduced-camera QR/SVD qualify data rank. The separate damped elimination and original raw-camera QR retain exactly the same global scales and arrowhead metric actions.
 * @evidence contracts/common.md#clear-and-simple-design A metric-specific operation returns only rank diagnostics and current actions, while the ordinary full-step API continues to synthesize its complete answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No dummy zero step/gradient, Gram matrix, normalized-factor substitution, floor, exception fallback or damping-derived rank supplies a model. Input and materialized transformed rows/right/triangles remain finite; uncomputed damped-normalized QR/SVD/gradient/LS-answer support is not claimed or used as an acceptance certificate.
 * @evidence contracts/common.md#meaningful-documentation Support requires original rank and the actually used raw factor/actions. It can differ from the full LS operation's additional normalization, transformed-right, SVD and solution refusals, which remain unchanged for ordinary callers. Actual directions, all gates and physical normal KKT still decide the fit.
 * @evidence contracts/performance.md#efficient-algorithms Current point preparation/elimination and original rank cost O(E*C^2+S*C^3), then one raw damped camera QR supplies the metric. Unused scaled gradients, both LS answers, damped normalized SVD and point back substitution are omitted without claiming a host-time bound.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared original preparation/factorization preserve row and operation order. The original rank record is consumed immediately as one ratio and released before damped scalable work; no second metric normalization or cross-state cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Original/damped rows, point triangles and current factors remain within the existing conservative full-model reserve. Only O(1) record shells and no new numerical copies are added. Preparation/qualification records expire here; returned closures capture only the same current triangles/scales/upper factor as before.
 */
export function factorRecoveryMapMetric(
  blocks: readonly IAutoMovieRecoveryMapJointBlock[],
  minimumRatio: number,
  damping: number,
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoveryMapMetricFit {
  if (!(damping >= 0) || !Number.isFinite(damping))
    throw new Error("camera-map: bounded joint blocks required");
  const prepared: IAutoMovieRecoveryMapJointPreparation = prepareRecoveryMapJointBlocks(blocks, minimumRatio, budget, false);
  const original: IAutoMovieRecoveryMapElimination = prepared.eliminate(0);
  const cameraDesignRatio: number = factorRecoveryMapDesign(original.rows, original.right, minimumRatio, budget).designRatio;
  const damped: IAutoMovieRecoveryMapElimination = damping > 0 ? prepared.eliminate(damping) : original;
  if (!damped.right.every(Number.isFinite) || damped.triangular.some(
    (block: number[][]): boolean => block.some((row: number[]): boolean => !row.every(Number.isFinite)),
  )) throw new Error("camera-map: nonrepresentable eliminated metric design");
  return { cameraDesignRatio, minimumPointDesignRatio: prepared.minimumPointDesignRatio,
    metric: createRecoveryMapMetric(damped.triangular, damped.rows, prepared.pointScales, prepared.cameraScales, budget) };
}
