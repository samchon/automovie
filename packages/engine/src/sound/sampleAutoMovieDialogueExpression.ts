import type { IAutoMovieExpression } from "@automovie/interface";
import { IAutoMovieDialogueExpressionLayers } from "./IAutoMovieDialogueExpressionLayers";
import { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";

/**
 * Sample authored emotion and derived mouth state without either replacing the
 * other. Frames outside the line and explicit receipt gaps are `neutral` at
 * zero intensity; sampling never depends on a previous cursor.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-seek-equivalence Makes arbitrary seek equal sequential sampling.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Composes the mouth layer at the requested emission frame.
 */
export const sampleAutoMovieDialogueExpression = (props: {
  /** Compiled actor mouth timeline. */
  timeline: IAutoMovieDialogueVisemeTimeline;
  /** Film-global frame to sample. */
  frame: number;
  /** Authored emotion/expression, retained unchanged. */
  authored: IAutoMovieExpression | null;
}): IAutoMovieDialogueExpressionLayers => {
  if (!Number.isSafeInteger(props.frame) || props.frame < 0)
    throw new Error("dialogue expression frame must be a non-negative integer");
  const viseme = props.timeline.ranges.find(
    (range) => props.frame >= range.startFrame && props.frame < range.endFrame,
  )?.viseme;
  return {
    authored: props.authored,
    mouth:
      viseme === undefined || viseme === "rest"
        ? { preset: "neutral", intensity: 0 }
        : { preset: viseme, intensity: 1 },
  };
};
