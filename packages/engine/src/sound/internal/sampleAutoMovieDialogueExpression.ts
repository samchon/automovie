import type {
  IAutoMovieDialogueExpressionLayers,
  IAutoMovieSampleDialogueExpression,
} from "@automovie/interface";

import { sampleAutoMovieDialogueVisemeWeights } from "./sampleAutoMovieDialogueVisemeWeights";

/*
 * Sample a speaker's coarticulated viseme weights at one frame beside the
 * unchanged authored expression.
 * Parameter props: The joined timeline, the frame, the film rate and the authored
 * expression.
 * Returns: The authored layer and the mouth layer's viseme weights.
 */
export function sampleAutoMovieDialogueExpression(
  props: IAutoMovieSampleDialogueExpression.IProps,
): IAutoMovieDialogueExpressionLayers {
  return {
    authored: props.authored,
    mouth: { visemes: sampleAutoMovieDialogueVisemeWeights(props) },
  };
}
