import type { IAutoMovieProductionFrameIntervalToGridTicks } from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "./productionFrameBoundaryToGridTick";

/*
 * Map one positive film-frame interval onto a destination integer clock, and
 * refuse an interval the clock cannot represent.
 *
 * Both boundaries go through productionFrameBoundaryToGridTick with the
 * same rounding, so adjacent intervals share their boundary tick and tile the
 * destination clock without gaps or overlaps. An interval whose end frame is
 * not after its start frame throws an `Error`, and so does one whose two
 * boundaries land on the same tick, because a caption or sound region with no
 * duration on its own clock is not a delivered interval. Every error of the
 * boundary map passes through.
 * Parameter props.startFrame: First film frame of the interval, inclusive.
 * Parameter props.endFrame: Film frame after the last one, exclusive.
 * Parameter props.frameRate: The film's frame rate as an exact ratio.
 * Parameter props.ticksPerSecond: Destination clock rate, a positive safe integer.
 * Parameter props.rounding: How a boundary between two ticks is resolved.
 * Returns: The interval's start and end ticks, end exclusive.
 */
export function productionFrameIntervalToGridTicks(
  props: IAutoMovieProductionFrameIntervalToGridTicks.IProps,
): IAutoMovieProductionFrameIntervalToGridTicks.IResult {
  if (props.endFrame <= props.startFrame)
    throw new Error(
      `Production interval ${props.startFrame}..${props.endFrame} must have a positive frame duration.`,
    );
  const start: number = productionFrameBoundaryToGridTick({
    frame: props.startFrame,
    frameRate: props.frameRate,
    ticksPerSecond: props.ticksPerSecond,
    rounding: props.rounding,
  });
  const end: number = productionFrameBoundaryToGridTick({
    frame: props.endFrame,
    frameRate: props.frameRate,
    ticksPerSecond: props.ticksPerSecond,
    rounding: props.rounding,
  });
  if (end <= start)
    throw new Error(
      `Production interval ${props.startFrame}..${props.endFrame} collapses to ${start}..${end} on the ${props.ticksPerSecond}-tick destination clock.`,
    );
  return { start, end };
}
