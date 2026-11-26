import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../film/internal/productionFrameBoundaryToGridTick";
import { resolveProductionFrameRate } from "../film/internal/resolveProductionFrameRate";

/**
 * A dialogue line's frame levels: for each film frame of its span, the RMS
 * amplitude of the line's own samples inside that frame interval.
 *
 * The line plays from its start frame's sample tick, so frame `f` covers the
 * line's samples from `tick(f) − tick(startFrame)` up to `tick(f + 1) −
 * tick(startFrame)`, with frame boundaries mapped to ticks by the nearest-tick
 * rule the mixer places the line with. Samples past the line's end count as
 * silence, so a frame after the last sample has level 0. The level is a linear
 * amplitude; `20 log10` of it is the frame level in dBFS.
 *
 * @param clock The film clock and sample rate of the plan the line belongs to.
 * @param line The line's span on the film clock.
 * @param samples The line's mono samples at `clock.sampleRate`.
 * @returns One linear RMS amplitude per frame from `line.startFrame` to
 *   `line.endFrame − 1`.
 */
export function productionDialogueFrameLevels(
  clock: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate"
  >,
  line: Pick<
    IAutoMovieProductionSoundPlan["dialogue"][number],
    "startFrame" | "endFrame"
  >,
  samples: ArrayLike<number>,
): Float64Array {
  const tick: (frame: number) => number = (frame: number): number =>
    productionFrameBoundaryToGridTick({
      frame,
      frameRate: resolveProductionFrameRate(clock),
      ticksPerSecond: clock.sampleRate,
      rounding: "nearest",
    });
  const origin: number = tick(line.startFrame);
  const levels: Float64Array = new Float64Array(
    Math.max(0, line.endFrame - line.startFrame),
  );
  for (let index: number = 0; index < levels.length; ++index) {
    const from: number = tick(line.startFrame + index) - origin;
    const to: number = tick(line.startFrame + index + 1) - origin;
    let energy: number = 0;
    for (let at: number = from; at < Math.min(to, samples.length); ++at)
      energy += samples[at]! * samples[at]!;
    levels[index] = to > from ? Math.sqrt(energy / (to - from)) : 0;
  }
  return levels;
}
