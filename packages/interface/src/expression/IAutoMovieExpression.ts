import { AutoMovieExpressionPreset } from "./AutoMovieExpressionPreset";
import { IAutoMovieBlendshapeChannel } from "./IAutoMovieBlendshapeChannel";

/**
 * A facial expression at one instant: preset, intensity and a required nullable ARKit override list.
 *
 * Preset and intensity supply coarse semantic control; blendshapes overrides expanded ARKit weights. Visible response requires matching morph targets or a host-supplied expression sink, so the names alone do not establish portability across every avatar or equivalent appearance.
 *
 * validateExpression refuses unknown names, nonfinite or out-of-range [0, 1] magnitudes and repeated channels when invoked. The viewer separately clamps finite values to [0, 1] and treats nonfinite values as zero.
 *
 * sampleMotion blends same-preset intensity and channel weights using outgoing eased progress, switching differing presets when that progress reaches 0.5. An absent side is neutral intensity zero with no channels. Cubic y controls can overshoot between admitted keys; the sampler does not independently gate expression magnitudes there.
 *
 * @evidence contracts/common.md#principled-implementation sampleMotion uses outgoing eased progress t for same-preset linear intensity/channel interpolation, switches differing presets at t = 0.5 and substitutes zero intensity/no channels for an absent side. That threshold need not be the chronological segment midpoint.
 * @evidence contracts/common.md#clear-and-simple-design Three required fields separate the coarse preset and intensity from nullable fine overrides; null expresses no overrides without omitting a required member, and validation shares closed names and unit-interval authored magnitudes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation refuses duplicate channels rather than assigning authoring-time merge semantics. Differing presets switch at eased progress 0.5 instead of receiving an invented per-avatar cross-fade; key admission does not prove intermediate magnitudes remain in range or that the avatar implements the requested targets.
 * @evidence contracts/common.md#meaningful-documentation States the two control levels and when to use each, the validator's refusals, and the interpolation rules between keyframes; members give the intensity range and the meaning of `null` overrides and their uniqueness rule.
 */
export interface IAutoMovieExpression {
  /** Coarse emotion, viseme or eye intent. */
  preset: AutoMovieExpressionPreset;

  /** How strongly `preset` applies, in `[0, 1]`. */
  intensity: number;

  /**
   * ARKit weights replacing expanded preset contributions for the same channel, or null when there are no overrides; each channel at most once.
   */
  blendshapes: IAutoMovieBlendshapeChannel[] | null;
}
