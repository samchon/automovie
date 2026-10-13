import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/** Map one nonnegative film-frame boundary to deterministic seconds. */
export const productionFrameBoundaryToSeconds = (props: {
  frame: number;
  frameRate: IAutoMovieProductionFrameRate;
}): number => {
  if (Number.isSafeInteger(props.frame) === false || props.frame < 0)
    throw new Error(
      `Production frame boundary ${props.frame} must be a nonnegative safe integer.`,
    );
  const rate = canonicalProductionFrameRate(props.frameRate);
  return (props.frame * rate.denominator) / rate.numerator;
};
