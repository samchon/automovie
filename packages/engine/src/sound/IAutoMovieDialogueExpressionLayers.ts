import type { AutoMovieExpressionPreset, IAutoMovieExpression } from "@automovie/interface";

/**
 * Authored expression and derived mouth layers at one frame.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Preserves authored emotion while adding mouth motion.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Keeps mouth composition explicit.
 */
export interface IAutoMovieDialogueExpressionLayers {
  /**
   * Unchanged authored expression layer.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Prevents lip-sync from erasing emotion.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Separates authored and derived channels.
   */
  authored: IAutoMovieExpression | null;
  /**
   * Derived mouth-only preset.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Applies speech only to the mouth layer.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Provides the renderer-facing mouth state.
   */
  mouth: {
    /** Mouth preset, with `neutral` representing receipt `rest`. */
    preset: AutoMovieExpressionPreset;
    /** Zero for rest and one for an active viseme. */
    intensity: number;
  };
}
