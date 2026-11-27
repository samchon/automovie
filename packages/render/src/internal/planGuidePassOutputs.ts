import type {
  AutoMovieGuidePass,
  IAutoMovieGuidePassOutput,
  IAutoMoviePlanGuidePassOutputsProps,
} from "@automovie/interface";

import { guidePassFrameName } from "./guidePassFrameName";
import { guidePassFramePattern } from "./guidePassFramePattern";
import { normalizeGuidePasses } from "./normalizeGuidePasses";

/*
 * Plan where each requested pass writes its frames inside one frame directory:
 * one capture per pass per frame, at pass-tagged paths.
 *
 * Passes are normalized by `normalizeGuidePasses`, so repeats fold and an
 * unknown name throws; an empty request yields an empty plan. Throws when
 * `frameCount` is not a positive integer. Paths use the default `png` extension
 * and five-digit numbering.
 */
export const planGuidePassOutputs: (
  props: IAutoMoviePlanGuidePassOutputsProps,
) => IAutoMovieGuidePassOutput[] = (
  props: IAutoMoviePlanGuidePassOutputsProps,
): IAutoMovieGuidePassOutput[] => {
  if (props.frameCount <= 0)
    throw new Error(
      `guide pass frameCount must be a positive integer, but was ${props.frameCount}`,
    );
  return normalizeGuidePasses(props.passes).map(
    (pass: AutoMovieGuidePass): IAutoMovieGuidePassOutput => ({
      pass,
      firstFrame: `${props.frameDir}/${guidePassFrameName(0, pass)}`,
      lastFrame: `${props.frameDir}/${guidePassFrameName(props.frameCount - 1, pass)}`,
      inputPattern: `${props.frameDir}/${guidePassFramePattern(pass)}`,
    }),
  );
};
