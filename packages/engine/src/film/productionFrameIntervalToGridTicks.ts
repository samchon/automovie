import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "./productionFrameBoundaryToGridTick";

/**
 * Map one positive film-frame interval onto a destination integer clock, and
 * refuse an interval the clock cannot represent.
 *
 * Both boundaries go through {@link productionFrameBoundaryToGridTick} with the
 * same rounding, so adjacent intervals share their boundary tick and tile the
 * destination clock without gaps or overlaps. An interval whose end frame is
 * not after its start frame throws an `Error`, and so does one whose two
 * boundaries land on the same tick, because a caption or sound region with no
 * duration on its own clock is not a delivered interval. Every error of the
 * boundary map passes through.
 *
 * @param props.startFrame First film frame of the interval, inclusive.
 * @param props.endFrame Film frame after the last one, exclusive.
 * @param props.frameRate The film's frame rate as an exact ratio.
 * @param props.ticksPerSecond Destination clock rate, a positive safe integer.
 * @param props.rounding How a boundary between two ticks is resolved.
 * @returns The interval's start and end ticks, end exclusive.
 *
 * @evidence contracts/common.md#principled-implementation Maps each boundary of the half-open interval independently with the exact boundary map, so the tick interval is the image of the frame interval and neighbours meet on one tick; a collapse to an empty tick interval is refused because the half-open form would otherwise deliver nothing.
 * @evidence contracts/common.md#clear-and-simple-design The interval form of the boundary map used by WebVTT captions and production sound, keeping the collapse refusal in one place instead of in each consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A collapsed interval is refused rather than widened to one tick, which would shift its neighbour and break the tiling.
 * @evidence contracts/common.md#meaningful-documentation States that both ends share one rounding and why that tiles the clock, the half-open convention, both refusals and why a collapse is refused, and that boundary errors pass through.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: two boundary conversions and two comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure conversion of one interval; a caller tiling many intervals maps each shared boundary twice, two constant-time conversions that need no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned pair.
 */
export const productionFrameIntervalToGridTicks = (props: {
  startFrame: number;
  endFrame: number;
  frameRate: IAutoMovieProductionFrameRate;
  ticksPerSecond: number;
  rounding: "nearest" | "floor" | "ceiling";
}): { start: number; end: number } => {
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
};
