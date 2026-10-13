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
 * @evidence contracts/common.md#principled-implementation Emits a constant expression channel (`preset`, `intensity`) over the action span, which `compilePerformance` keeps only when the action's region is `face`, the default, so an emote never collides with body content and an overridden region masks the expression away.
 * @evidence contracts/common.md#clear-and-simple-design Adds only the preset and its strength to the shared base; the synthesizer fills `blendshapes` with `null`, so per-blendshape weights are not authorable through this verb.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No preset is special-cased; the clip has no ease in or out, so the preset appears at full `intensity` at `start`, and only the intensity range is validated here.
 * @evidence contracts/common.md#meaningful-documentation States the region, the held two-keyframe clip and its default length, the absent ramp, the intensity range and its refusal.
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
