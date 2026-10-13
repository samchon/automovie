import { AutoMovieExpressionPreset } from "./AutoMovieExpressionPreset";
import { IAutoMovieBlendshapeChannel } from "./IAutoMovieBlendshapeChannel";

/**
 * A facial expression at one instant: a coarse preset plus optional
 * fine-grained ARKit overrides.
 *
 * Two levels let the model work at the resolution a task needs:
 *
 * - `preset` and `intensity`: the coarse handle, such as `happy` at `0.8`,
 *   portable across every VRM avatar.
 * - `blendshapes`: ARKit channel overrides for precise lip shapes, asymmetric
 *   expressions or audio-driven lip-sync, layered over the preset.
 *
 * The engine's `validateExpression` refuses an unknown preset or channel, an
 * intensity or weight outside `[0, 1]`, and a channel set twice.
 *
 * Between two keyframes `sampleMotion` blends the same preset's intensity and
 * channel weights linearly, switches between different presets at the
 * midpoint, and treats a keyframe without an expression as the other side's
 * preset at intensity `0` with no channels, so an expression ramps in and out
 * instead of popping.
 *
 * @evidence contracts/common.md#principled-implementation `sampleMotion` interpolates intensity linearly and channel weights as `a(1 - t) + b t` per channel, switches presets at `t = 0.5` because two named presets have no meaningful blend, and substitutes intensity `0` of the authored preset for an absent side, matching how unauthored joints and transforms rest.
 * @evidence contracts/common.md#clear-and-simple-design A preset, one intensity and an optional override list keep the common case to two fields while still reaching the full 52-channel vector, and both levels share the closed-name and `[0, 1]` validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate channels are refused by validation instead of being merged by a consumer, and the midpoint switch is the stated rule for differing presets rather than a cross-fade invented per avatar.
 * @evidence contracts/common.md#meaningful-documentation States the two control levels and when to use each, the validator's refusals, and the interpolation rules between keyframes; members give the intensity range and the meaning of `null` overrides and their uniqueness rule.
 * @author Samchon
 */
export interface IAutoMovieExpression {
  /** Coarse emotion, viseme or eye intent. */
  preset: AutoMovieExpressionPreset;

  /** How strongly `preset` applies, in `[0, 1]`. */
  intensity: number;

  /**
   * ARKit channel overrides layered over `preset`, or `null` when the preset
   * alone suffices; each channel at most once.
   */
  blendshapes: IAutoMovieBlendshapeChannel[] | null;
}
