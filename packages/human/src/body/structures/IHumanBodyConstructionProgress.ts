import type { AutoMovieHumanBodyPartId } from "../anatomy/identity/AutoMovieHumanBodyPartId";

/**
 * A completed body construction boundary, never a timer or acceptance verdict.
 *
 * Constructor events have no document; evaluation events name the admitted
 * document. Parts and quantity paths identify completed source work. The
 * observer runs synchronously and an exception aborts the original call.
 *
 * @evidence contracts/common.md#principled-implementation Each event identifies work that actually completed at the body or source owner.
 * @evidence contracts/common.md#clear-and-simple-design One optional synchronous observer carries constructor and evaluation boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timer or synthetic heartbeat stands in for completed work.
 * @evidence contracts/common.md#meaningful-documentation States document omission, actual source work and observer failure propagation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source part identities are reported rather than defined.
 * @evidenceExclude contracts/modeling.md#parameter-channels Progress changes no authored input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Progress carries no coordinate or measurement.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing construction owners define boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation Progress establishes no appearance verdict.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No anatomical value is added.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission and source solvers retain their guards.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Progress adds no personal control.
 *
 * @author Samchon
 */
export interface IHumanBodyConstructionProgress {
  /** Actual immutable body basis being evaluated. */
  basis: string;

  /** Admitted document identity; absent during constructor work. */
  document?: string;

  /** Construction boundary that has completed. */
  stage:
    | "basis-schema-admitted"
    | "basis-copied"
    | "basis-admitted"
    | "document-admitted"
    | "shape-evaluated"
    | "pose-evaluated"
    | "skin-evaluated"
    | "source-quantity-read"
    | "source-part-completed"
    | "assembly-evaluated"
    | "model-validated";

  /** Actual source part whose work completed. */
  part?: AutoMovieHumanBodyPartId;

  /** Actual anatomical quantity path consumed. */
  path?: string;

  /** Completed source part population at this boundary. */
  completed?: number;

  /** Source part population of this assembly. */
  total?: number;
}
