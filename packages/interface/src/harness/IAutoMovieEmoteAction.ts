import type { AutoMovieExpressionPreset } from "../expression/AutoMovieExpressionPreset";
import type { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a facial expression preset on the actor's `face` region. Expression
 * content survives only the `face` mask, so overriding `region` strips it, and
 * `performShot` reports the dropped expression.
 *
 * The reference synthesizer emits a two-keyframe clip holding the preset at
 * `intensity` for the action's duration (1 s for `"auto"`), with no ramp in or
 * out, no body joints, and blendshape weights left `null`. `performShot`
 * refuses an intensity outside `[0, 1]`, including `NaN`.
 */
export interface IAutoMovieEmoteAction extends IAutoMovieActionBase {
  /** Selects a facial expression as the action family. */
  verb: "emote";

  /** Named expression preset applied by the action. */
  preset: AutoMovieExpressionPreset;

  /** Expression strength in `[0, 1]`, where `1` is the full preset. */
  intensity: number;
}
