import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/** Resolve the exact rate carried beside the legacy display scalar. */
export const resolveProductionFrameRate = (props: {
  fps: number;
  frameRate?: IAutoMovieProductionFrameRate;
}): IAutoMovieProductionFrameRate => {
  const rate = canonicalProductionFrameRate(props.frameRate ?? props.fps);
  if (
    props.frameRate !== undefined &&
    props.fps !== rate.numerator / rate.denominator
  )
    throw new Error(
      `Production fps ${props.fps} does not equal its exact ${rate.numerator}/${rate.denominator} frame-rate identity.`,
    );
  return rate;
};
