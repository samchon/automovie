import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/**
 * One actual forward result shared by fitting and the final garment emitter.
 *
 * @evidence contracts/common.md#principled-implementation Candidate base, actual lifted positions/normals and original field/located geometry readings describe one forward evaluation in material order.
 * @evidence contracts/common.md#clear-and-simple-design Fitting and final emission share one evaluated answer while global intersection checking remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Local geometryAccepted cannot certify global embedding, and positive field excess has no added acceptance allowance.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish base from emitted lift, meter field residual and local conditions from global intersection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Surface-evaluation typing performs no normal transport or complete forward geometry checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One forward-result carrier exposes completed work without owning cache equivalence across candidates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Output arrays and violation records have consumer lifetime; this declaration acquires no evaluator or numerical handle.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceEvaluation {
  /** Candidate connected base in original material order. */
  base: number[];

  /** Actual emitted positions after the declared normal lift. */
  positions: number[];

  /** Actual transported unit vertex normals used for that same lift. */
  normals: number[];

  /** Maximum original nearest-centre field excess, metres; no positive allowance. */
  fieldResidualMetres: number;

  /** Every located local geometric failure, without dropping material faces. */
  violations: IHumanBodyUnderwearSurfaceViolation[];

  /** Actual local conditions passed; global intersection remains separate. */
  geometryAccepted: boolean;
}
