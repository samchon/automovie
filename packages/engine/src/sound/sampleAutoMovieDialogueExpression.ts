import { IAutoMovieExpression } from "@automovie/interface";
import { IAutoMovieDialogueExpressionLayers } from "./IAutoMovieDialogueExpressionLayers";
import { IAutoMovieDialogueVisemeTimeline } from "./IAutoMovieDialogueVisemeTimeline";
import { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";
/**
 * Sample one joined emission-clock mouth range beside the unchanged authored expression.
 *
 * @evidence contracts/common.md#principled-implementation A nonnegative safe frame selects the first half-open containing range; active closed visemes map to intensity one, while rest/outside maps to neutral intensity zero under the joined ordering premise.
 * @evidence contracts/common.md#clear-and-simple-design The sampler returns separate authored/mouth layers without merging expression fields or changing the actor; timeline construction belongs to the join owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored emotion is borrowed unchanged, and no interpolated mouth strength, actor guess or audible-arrival shift is introduced; repository actor application remains unwired.
 * @evidence contracts/common.md#meaningful-documentation Documents nonnegative film frames, arbitrary seek, borrowed authored identity and fresh mouth/result ownership; hand-built malformed timelines are not revalidated here.
 * @evidence contracts/performance.md#efficient-algorithms R ranges require O(R) worst-case linear search and constant fresh output storage; the first matching range short-circuits traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared ranges are reused across independent frame queries, and no previous cursor or cached pose can alter a backward seek.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh wrapper/mouth pair, which retains the supplied authored expression reference until discarded; no scene, GPU or audio resource is retained.
 * @author Samchon
 */
export const sampleAutoMovieDialogueExpression: (props: { timeline: IAutoMovieDialogueVisemeTimeline; frame: number; authored: IAutoMovieExpression | null; }) => IAutoMovieDialogueExpressionLayers = (props: {
  /** Compiled actor mouth timeline. */
  timeline: IAutoMovieDialogueVisemeTimeline;
  /** Film-global frame to sample. */
  frame: number;
  /** Authored emotion/expression, retained unchanged. */
  authored: IAutoMovieExpression | null;
}): IAutoMovieDialogueExpressionLayers => {
  if (!Number.isSafeInteger(props.frame) || props.frame < 0)
    throw new Error("dialogue expression frame must be a non-negative integer");
  const viseme: IAutoMovieDialogueMouthRange["viseme"] | undefined = props.timeline.ranges.find(
    (range: IAutoMovieDialogueMouthRange): boolean => props.frame >= range.startFrame && props.frame < range.endFrame,
  )?.viseme;
  return {
    authored: props.authored,
    mouth:
      viseme === undefined || viseme === "rest"
        ? { preset: "neutral", intensity: 0 }
        : { preset: viseme, intensity: 1 },
  };
};
