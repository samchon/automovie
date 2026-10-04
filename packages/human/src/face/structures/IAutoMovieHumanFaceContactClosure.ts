import type { IAutoMovieHumanFaceSourceClosurePlan } from "./IAutoMovieHumanFaceSourceClosurePlan";

/**
 * The lip-closure companion of a face basis's oral contact.
 *
 * `channel` is the channel whose rows were decomposed as a delta at
 * `reference` weight one, a lip closure over an open jaw. Legacy replay scales
 * that native companion by the authored aperture ratio. A prepared
 * `sourceSpan` instead reads fixed native closure-zero/one states, replays
 * their source points, forms the registered closed endpoint and applies the
 * requested weight once before rigid contact.
 *
 * @evidence contracts/common.md#principled-implementation The companion channel and its reference weight define the closure delta, and an optional source span replaces aperture scaling with a registered endpoint.
 * @evidence contracts/common.md#clear-and-simple-design One named record groups the native companion and its optional source-span plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Channel names and plans are shared basis data, never a personal sculpt or fixture-selected gain.
 * @evidence contracts/common.md#meaningful-documentation States what the channel decomposes, the reference weight and the legacy versus source-span paths.
 * @evidence contracts/modeling.md#parameter-channels The closure companion is an existing named channel scaled by the measured aperture or replaced by the source-span blend.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names channels and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Channel and reference names carry no frame; the source plan states its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The source plan, not this record, owns the registered contact pairs.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner and face builder observe the evaluated closure.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record holds names and a plan, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactClosure {
  /** Native companion closure channel. */
  channel: string;

  /** Channel whose weight-one state the companion's delta was decomposed at. */
  reference: string;

  /** Fixed native-zero/one endpoints feed one requested source-span blend before rigid contact. */
  sourceSpan?: IAutoMovieHumanFaceSourceClosurePlan;
}
