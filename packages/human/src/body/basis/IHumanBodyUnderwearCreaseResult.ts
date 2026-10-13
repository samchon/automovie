import type { IHumanBodyUnderwearFitObservation } from "./IHumanBodyUnderwearFitObservation";

/**
 * Closed and lifted vertices retaining the cut garment's index population.
 *
 * @evidence contracts/common.md#principled-implementation Fitted positions, transported normals and per-vertex closing contributions preserve original cut correspondence alongside actual nonlinear observations.
 * @evidence contracts/common.md#clear-and-simple-design One result keeps output geometry and diagnostic readings separate from the input topology owned by its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fitting observations or closing weights do not certify global embedding, biological contact or rendered garment acceptance.
 * @evidence contracts/common.md#meaningful-documentation Members give meter-frame positions, unit lift normals, optional historical compatibility and vertex contribution meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Crease-result typing computes no transported normals or nonlinear restoration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Returned arrays expose completed outputs without a reusable fitting-cache policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The output schema describes owned arrays but acquires no native program, worker or cleanup operation.
 * @author Samchon
 */
export interface IHumanBodyUnderwearCreaseResult {
  /** Flat XYZ positions in the input skin metre frame. */
  positions: number[];

  /** Unit normals used for the garment lift. */
  normals: number[];

  /** Actual nonlinear solve readings; absence retains compatibility with older callers. */
  fitting?: IHumanBodyUnderwearFitObservation[];

  /** Closing contribution in [0, 1] for each cut vertex. */
  bridged: number[];
}
