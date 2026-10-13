import { AutoMovieArkitChannel } from "./AutoMovieArkitChannel";

/**
 * One ARKit blendshape channel set to a weight.
 *
 * The pair of a closed channel name and a `[0, 1]` weight is the fine-grained
 * facial control atom. A list of these is a fully-specified facial expression
 * at ARKit resolution: what Audio2Face streams and what an LLM can emit
 * directly because the space is named, bounded, and only 52-wide.
 *
 * In the viewer an override replaces, rather than adds to, the weight the
 * preset gives the same channel.
 *
 * @evidence contracts/common.md#principled-implementation A name and weight pair over the closed ARKit union; `validateExpression` refuses an unknown name, a weight outside `[0, 1]` and a channel set twice in one list, and between keyframes `sampleMotion` blends weights per channel, counting a channel missing on one side as zero.
 * @evidence contracts/common.md#clear-and-simple-design Two fields so an override list is a short array of atoms rather than a 52-key object in which every untouched channel would need a value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The viewer clamps the weight to `[0, 1]` and sets it over any preset-derived value for that channel; this override rule is applied to every model alike, not to particular rigs.
 * @evidence contracts/common.md#meaningful-documentation States the closed 52-name menu, the weight range and the meaning of its endpoints, and that an override replaces the preset's contribution.
 * @author Samchon
 */
export interface IAutoMovieBlendshapeChannel {
  /** Which ARKit channel, from the closed 52-name menu. */
  channel: AutoMovieArkitChannel;

  /** Activation weight, `[0, 1]`. `0` = inactive, `1` = full. */
  weight: number;
}
