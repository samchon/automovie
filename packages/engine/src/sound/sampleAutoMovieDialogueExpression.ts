import type {
  IAutoMovieDialogueExpressionLayers,
  IAutoMovieDialogueMouthRange,
  IAutoMovieSampleDialogueExpression,
} from "@automovie/interface";

/**
 * Sample one joined emission-clock mouth range beside the unchanged authored expression.
 */
export const sampleAutoMovieDialogueExpression: (
  props: IAutoMovieSampleDialogueExpression.IProps,
) => IAutoMovieDialogueExpressionLayers = (
  props: IAutoMovieSampleDialogueExpression.IProps,
): IAutoMovieDialogueExpressionLayers => {
  if (!Number.isSafeInteger(props.frame) || props.frame < 0)
    throw new Error("dialogue expression frame must be a non-negative integer");
  const viseme: IAutoMovieDialogueMouthRange["viseme"] | undefined =
    props.timeline.ranges.find(
      (range: IAutoMovieDialogueMouthRange): boolean =>
        props.frame >= range.startFrame && props.frame < range.endFrame,
    )?.viseme;
  return {
    authored: props.authored,
    mouth:
      viseme === undefined || viseme === "rest"
        ? { preset: "neutral", intensity: 0 }
        : { preset: viseme, intensity: 1 },
  };
};
