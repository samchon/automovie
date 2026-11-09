import { IAutoMovieExpression, IAutoMoviePose } from "@automovie/interface";

/**
 * A pose plus optional expression sampled at one instant of a clip.
 * sampleMotion retargets pose.skeleton to the motion id, interpolates clinical
 * joint degrees and root TRS, and uses null when neither endpoint expresses.
 * Endpoint expressions and nested endpoint pose data may alias the clip.
 *
 * @evidence contracts/development/design.md#principled-representation Keeps articulated body and facial expression together at one motion time, with null expression representing two unauthored endpoints rather than a fabricated facial preset.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two sampled values are consumed by planting and playback without carrying redundant keyframe times or interpolation metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sample shape encodes no actor-specific defaults; sampleMotion alone owns endpoint and preset-transition semantics.
 * @evidence contracts/development/common.md#meaningful-documentation States the sampler, clinical and root domains, expression absence and endpoint aliasing that consumers must preserve.
 */
export interface IAutoMovieMotionSample {
  /** Interpolated body pose at the sampled instant. */
  pose: IAutoMoviePose;

  /** Interpolated expression, or `null` when the motion has none. */
  expression: IAutoMovieExpression | null;
}
