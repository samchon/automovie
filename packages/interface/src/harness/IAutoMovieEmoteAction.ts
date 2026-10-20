import { AutoMovieExpressionPreset } from "../expression/AutoMovieExpressionPreset";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a facial expression preset on the actor's `face` region. Expression
 * content survives only the `face` mask, so overriding `region` strips it, and
 * `performShot` reports the dropped expression.
 *
 * The reference synthesizer emits a two-keyframe clip holding the preset at
 * `intensity` for the action's duration (1 s for `"auto"`), with no ramp in or
 * out, no body joints, and blendshape weights left `null`. `performShot`
 * refuses an intensity outside `[0, 1]`, including `NaN`.
 *
 * @evidence contracts/common.md#principled-implementation The synthesizer writes the same expression at the clip's first and last keyframe with linear easing, so the preset holds constant over the span and the face region's lane carries it alone.
 * @evidence contracts/common.md#clear-and-simple-design A named preset and one strength are enough to state an emotion; blendshape weights are left to the renderer's preset mapping instead of being authored per action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The synthesized base has no ramp and out-of-range intensity is refused. Composite layering and rest lead-in can introduce linear boundary transitions over up to 1e-6 seconds; this base-clip shape therefore does not guarantee an exact discontinuous onset or offset in assembled playback. Visible morphing also requires matching model targets.
 * @evidence contracts/common.md#meaningful-documentation States the region and what an override does, the exact clip shape and `"auto"` length, the absent ramp, and the intensity refusal; members give the preset role and the intensity scale.
 */
export interface IAutoMovieEmoteAction extends IAutoMovieActionBase {
  /** Selects a facial expression as the action family. */
  verb: "emote";

  /** Named expression preset applied by the action. */
  preset: AutoMovieExpressionPreset;

  /** Expression strength in `[0, 1]`, where `1` is the full preset. */
  intensity: number;
}
