import { IAutoMovieExpression, IAutoMoviePose } from "@automovie/interface";

/**
 * A pose plus optional expression sampled at one instant of a clip.
 * sampleMotion retargets pose.skeleton to the motion id, interpolates clinical
 * joint degrees and root TRS, and uses null when neither endpoint expresses.
 * Endpoint expressions and nested endpoint pose data may alias the clip.
 *
 * @evidence contracts/common.md#principled-implementation Keeps articulated body and facial expression together at one motion time, with null expression representing two unauthored endpoints rather than a fabricated facial preset.
 * @evidence contracts/common.md#clear-and-simple-design Two sampled values are consumed by planting and playback without carrying redundant keyframe times or interpolation metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sample shape encodes no actor-specific defaults; sampleMotion alone owns endpoint and preset-transition semantics.
 * @evidence contracts/common.md#meaningful-documentation States the sampler, clinical and root domains, expression absence and endpoint aliasing that consumers must preserve.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sampled record runs no interpolation; joint maps and segment search are chosen by sampleMotion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A sample carries one time's body and face but defines no cross-time sampling cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the sample wrapper and any newly interpolated values; borrowed endpoint data remains owned by the source clip.
 */
export interface IAutoMovieMotionSample {
  /** Interpolated body pose at the sampled instant. */
  pose: IAutoMoviePose;

  /** Interpolated expression, or `null` when the motion has none. */
  expression: IAutoMovieExpression | null;
}
