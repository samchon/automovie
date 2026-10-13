import { AutoMovieExpressionPreset } from "./AutoMovieExpressionPreset";
import { IAutoMovieBlendshapeChannel } from "./IAutoMovieBlendshapeChannel";

/**
 * A facial expression at one instant: coarse preset intent plus optional
 * fine-grained ARKit overrides.
 *
 * AutoMovie offers two registration levels so the model can work at whatever
 * resolution the task needs:
 *
 * - `preset` + `intensity`: the **coarse, most reliable** handle. "Look happy at
 *   0.8." Portable across every VRM avatar.
 * - `blendshapes`: **fine-grained** ARKit channel overrides for precise lip
 *   shapes, asymmetric expressions, or audio-driven lip-sync, layered on top of
 *   the preset. `null` when the preset alone is enough.
 *
 * This split keeps the common case tiny (one preset + one number) while still
 * allowing the full 52-channel vector when needed, and both are validated the
 * same way (closed names, `[0, 1]` weights).
 *
 * Between two keyframes the same preset blends its intensity linearly,
 * different presets switch at the midpoint, and a keyframe without an
 * expression counts as the other side's preset at intensity `0`.
 *
 * @evidence contracts/common.md#principled-implementation Preset with intensity is the coarse control and `blendshapes` the optional fine layer; `interpolateExpression` blends intensity and channels linearly when two keyframes share a preset, switches at `t = 0.5` when they differ, and substitutes a zero-intensity copy of the other side's preset for a `null` side so an expression ramps in instead of popping.
 * @evidence contracts/common.md#clear-and-simple-design Both levels live in one record instead of two expression types, so the common case is one name and one number while the same keyframe can still carry channel overrides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The midpoint switch between different presets is the one interpolation rule for every preset pair, not a per-preset exception, and a repeated channel is refused by `validateExpression` rather than merged.
 * @evidence contracts/common.md#meaningful-documentation Explains the two registration levels, what `null` blendshapes means, the `[0, 1]` range of intensity and weights, the at-most-once channel rule, and how keyframes interpolate.
 * @author Samchon
 */
export interface IAutoMovieExpression {
  /** Coarse emotion / viseme intent. */
  preset: AutoMovieExpressionPreset;

  /** How strongly to apply `preset`, `[0, 1]`. */
  intensity: number;

  /**
   * Optional fine-grained ARKit channel overrides layered on top of `preset`.
   * `null` when the preset alone suffices. Each channel should appear at most
   * once.
   */
  blendshapes: IAutoMovieBlendshapeChannel[] | null;
}
