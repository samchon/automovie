import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "./productionFrameBoundaryToGridTick";

/** Map one positive film interval and refuse a destination-grid collapse. */
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
  const start = productionFrameBoundaryToGridTick({
    frame: props.startFrame,
    frameRate: props.frameRate,
    ticksPerSecond: props.ticksPerSecond,
    rounding: props.rounding,
  });
  const end = productionFrameBoundaryToGridTick({
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
