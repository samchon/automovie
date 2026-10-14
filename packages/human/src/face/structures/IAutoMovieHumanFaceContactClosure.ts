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
 * @evidence contracts/common.md#principled-implementation Native closure/reference channels identify the authored companion; optional sourceSpan substitutes fixed native endpoint replay and one requested blend before rigid contact for legacy aperture-scaled residual replay.
 * @evidence contracts/common.md#clear-and-simple-design Channel/reference identity and optional prepared plan state the two existing replay paths while full contact admission stays with the basis owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The companion is not a freely edited lip curve, and native gain alone certifies no full seal or physiological closure trajectory.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes legacy aperture ratio from source-span replay and states the reference weight-one decomposition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type runs no endpoint replay or contact measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Plan identity supplies replay inputs, not a posed-state cache or shared closure result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns the optional prepared plan and channel names; no replay buffers/task are allocated by the type.
 *
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
