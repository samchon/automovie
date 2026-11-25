import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../film/productionFrameBoundaryToGridTick";
import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";

/**
 * The exclusive end frame of a line's speech span: the first frame whose
 * boundary tick on the plan's sample clock is at least the start frame's tick
 * plus the line's sample count.
 *
 * Boundaries map to ticks by the nearest-tick rule of
 * `productionFrameBoundaryToGridTick`, the same rule the mixer places the line
 * with, so the span always holds every placed sample. The count is the line's
 * length at the plan rate, `round(sourceSamples × sampleRate /
 * sourceSampleRate)` for an adopted receipt, which is the length ingest's
 * decode produces.
 *
 * @param clock The film clock and sample rate of the plan the line belongs to.
 * @param startFrame Film-global start frame of the line, a nonnegative safe
 *   integer.
 * @param samples The line's positive sample count at `clock.sampleRate`.
 * @returns The speech end frame, greater than `startFrame`.
 * @throws {Error} When the start frame or the sample count is not a valid
 *   count.
 */
export function productionSpeechEndFrame(
  clock: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate"
  >,
  startFrame: number,
  samples: number,
): number {
  if (samples <= 0)
    throw new Error(
      `A speech span needs a positive whole sample count, but the line has ${samples} samples.`,
    );
  const frameRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(clock);
  const tick: (frame: number) => number = (frame: number): number =>
    productionFrameBoundaryToGridTick({
      frame,
      frameRate,
      ticksPerSecond: clock.sampleRate,
      rounding: "nearest",
    });
  const target: number = tick(startFrame) + samples;

  // The closed-form estimate floor(target · n / (d · rate)) lies within one
  // frame of the answer, because nearest rounding moves a boundary by at most
  // half a tick; the two loops settle that frame and each runs at most twice.
  let frame: number = Math.max(
    startFrame + 1,
    Math.floor(
      (target * frameRate.numerator) /
        (frameRate.denominator * clock.sampleRate),
    ),
  );
  while (tick(frame) < target) ++frame;
  while (frame - 1 > startFrame && tick(frame - 1) >= target) --frame;
  return frame;
}
