/**
 * The weight range a body channel can be evaluated over on its basis, and why
 * it ends where it does.
 *
 * @evidence contracts/common.md#principled-implementation Names the one reach every solve and editor row brackets in.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The limits name the missing source target instead of clamping silently.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#parameter-channels Bounds the one channel's weight inside its declared envelope.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It asserts no anatomical value.
 * @evidence contracts/anatomy.md#permitted-range The reach is the source's evaluable envelope, not a physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelReach {
  /** Lowest evaluable weight. */
  minimum: number;

  /** Highest evaluable weight. */
  maximum: number;

  /** One sentence per side whose reach ends before the envelope, naming the missing target. */
  limits: string[];
}
