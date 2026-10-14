import { resolveProductionFrameRate } from "@automovie/engine";
import { IAutoMovieFilmTimeline, IAutoMovieProductionMediaProbe, type IAutoMovieProductionFrameRate } from "@automovie/interface";


/**
 * Require exact frame count and rational presentation duration for a video probe against the canonical film timeline; failures throw before the caller accepts that role.
 *
 * @evidence contracts/common.md#principled-implementation BigInt cross multiplication compares movieDuration times the frame-rate numerator with totalFrames times the denominator and movieTimescale, avoiding floating runtime tolerance. Caller profile admission establishes positive safe clocks; resolveProductionFrameRate admits the timeline's canonical rate here.
 * @evidence contracts/common.md#clear-and-simple-design A single timing assertion handles both feature video and guide video after their codec/profile owners. Pixel equality and audio presentation are separate checks rather than implicit consequences of this duration comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No epsilon, rounded runtime, or fixture-dependent frame count compensates for a mismatch. This assertion relies on prior probe admission and does not independently validate decoded frames or malformed clocks.
 * @evidence contracts/common.md#meaningful-documentation The purpose identifies exact rational timing, required admitted clocks, and thrown failures. The comment separates presentation duration from decoded picture content.
 * @evidence contracts/performance.md#efficient-algorithms The operation uses a constant number of integer comparisons and BigInt products with memory proportional to their numeric representation; no frame population is traversed or materialized.
 * @evidence contracts/performance.md#reuse-equivalent-work The passed timeline and probe are borrowed, with the canonical rate resolved for this comparison. No result is cached because current timing inputs are cheap to compare directly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only local numeric intermediates are created and released on return or throw. The caller retains ownership of the timeline and probe; this assertion owns no handles, buffers, or background tasks.
 */
export const productionDeliveryValidationAssertExactVideoTimeline: (video: Extract<IAutoMovieProductionMediaProbe, { kind: "video"; }>, timeline: IAutoMovieFilmTimeline) => void = (
  video: Extract<IAutoMovieProductionMediaProbe, { kind: "video" }>,
  timeline: IAutoMovieFilmTimeline,
): void => {
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(timeline);
  if (video.frameCount !== timeline.totalFrames)
    throw new Error(
      `Video sample count ${video.frameCount} differs from current timeline ${timeline.totalFrames}.`,
    );
  if (
    BigInt(video.presentation.movieDuration) * BigInt(frameRate.numerator) !==
    BigInt(timeline.totalFrames) *
      BigInt(frameRate.denominator) *
      BigInt(video.presentation.movieTimescale)
  )
    throw new Error(
      "Video presentation duration does not equal the current exact frame boundary.",
    );
};
