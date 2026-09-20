import type { IAutoMovieProductionFrameRate } from "@automovie/interface";
import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Resolve the exact rate carried beside the legacy display scalar.
 *
 * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-rational-frame-rate Keeps a fractional delivery rate unambiguous while retaining lossless integer-rate compatibility.
 * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Makes the canonical numerator and denominator authoritative over a decimal display projection.
 */
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
