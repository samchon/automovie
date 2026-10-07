import type { AutoMovieHumanBodyExteriorGapReason } from "./AutoMovieHumanBodyExteriorGapReason";

/**
 * A surface target of the numerical body request that the exterior cannot
 * answer yet, with the dependency it lacks.
 *
 * A path appears either here or in `HUMAN_BODY_EXTERIOR_TARGETS`, never in
 * both: a gap is not approximated by another instrument, and the editor lists
 * it disabled with its detail.
 *
 * @evidence contracts/common.md#principled-implementation Names the exact missing dependency instead of leaving an unbound path invisible.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A gap carries no stand-in rule or channel.
 * @evidence contracts/common.md#meaningful-documentation States the exclusivity with the binding table.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It names no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The detail names what the source lacks; no anatomical value is asserted.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorGap {
  /** Document path below `anatomy`, such as `surface.leftUpperLimb.hand.length`. */
  readonly path: string;

  /** The kind of dependency the path lacks. */
  readonly reason: AutoMovieHumanBodyExteriorGapReason;

  /** One sentence naming the missing landmark, rule or tissue. */
  readonly detail: string;
}
