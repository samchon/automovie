import { AutoMovieExpressionPreset } from "../expression/AutoMovieExpressionPreset";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/**
 * Play a facial expression preset on the actor's `face` region. Expression
 * content survives only the `face` mask, so overriding `region` strips it.
 *
 * The reference synthesizer emits a two-keyframe face clip holding the preset
 * at `intensity` from the action's start to its end (1 s for `"auto"`), with
 * no ramp in or out; blendshape weights are left `null`. `performShot` refuses
 * an intensity outside `[0, 1]`.
 *
 * @author Samchon
 */
export interface IAutoMovieEmoteAction extends IAutoMovieActionBase {
  /** Selects a facial expression as the action family. */
  verb: "emote";

  /** Named expression preset applied by the action. */
  preset: AutoMovieExpressionPreset;

  /** Expression strength in `[0, 1]`, where `1` is the full preset. */
  intensity: number;
}
