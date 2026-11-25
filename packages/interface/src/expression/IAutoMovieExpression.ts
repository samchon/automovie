import type { AutoMovieExpressionPreset } from "./AutoMovieExpressionPreset";
import type { IAutoMovieBlendshapeChannel } from "./IAutoMovieBlendshapeChannel";

/**
 * A facial expression at one instant: preset, intensity and a required nullable
 * ARKit override list.
 *
 * Preset and intensity supply coarse semantic control; blendshapes overrides
 * expanded ARKit weights. Visible response requires matching morph targets or a
 * host-supplied expression sink, so the names alone do not establish
 * portability across every avatar or equivalent appearance.
 *
 * ValidateExpression refuses unknown names, nonfinite or out-of-range [0, 1]
 * magnitudes and repeated channels when invoked. The viewer separately clamps
 * finite values to [0, 1] and treats nonfinite values as zero.
 *
 * SampleMotion blends same-preset intensity and channel weights using outgoing
 * eased progress, switching differing presets when that progress reaches 0.5.
 * An absent side is neutral intensity zero with no channels. Cubic y controls
 * can overshoot between admitted keys; the sampler does not independently gate
 * expression magnitudes there.
 */
export interface IAutoMovieExpression {
  /** Coarse emotion, viseme or eye intent. */
  preset: AutoMovieExpressionPreset;

  /** How strongly `preset` applies, in `[0, 1]`. */
  intensity: number;

  /**
   * ARKit weights replacing expanded preset contributions for the same channel,
   * or null when there are no overrides; each channel at most once.
   */
  blendshapes: IAutoMovieBlendshapeChannel[] | null;
}
