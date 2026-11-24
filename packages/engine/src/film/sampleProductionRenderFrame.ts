import {
  IAutoMovieFilmTimeline,
  IAutoMovieFilmTimelineSegment,
  IAutoMovieProductionFrameRate,
  type IAutoMovieProductionRenderFrame,
  type IAutoMovieProductionRenderLayer,
} from "@automovie/interface";

import { resolveProductionFrameRate } from "./resolveProductionFrameRate";

/**
 * Resolve one film-global frame to the shot frames that compose it, with
 * dissolve and fade weights.
 *
 * The active segment is the last one whose `[startFrame, endFrame)` contains
 * the frame; the canonical builder orders segment starts without gaps. Inside
 * an incoming dissolve of `d` frames, at offset `k` into the segment, the
 * outgoing segment's tail frame `sourceOutFrame - d + k` is layered at weight
 * `1 - k / d` under the incoming frame at `k / d`. Otherwise the one layer is
 * weighted by the smaller of an incoming fade's `k / d` and an outgoing fade's
 * `remaining / d`, where `remaining` counts this frame and the ones after it in
 * the segment. The timestamp is independently computed binary64 frame time at
 * the reduced rational rate, not an exact rational value.
 *
 * The answer depends only on the timeline and the frame number, so a browser
 * seek, a render chunk and a full render resolve the same layers. Throws when
 * the frame is not a safe integer inside `[0, totalFrames)`, when no segment
 * contains it, when a dissolving segment has no predecessor, or when the
 * timeline's rate fields disagree.
 *
 * @param timeline The canonical film timeline.
 * @param globalFrame Film-global frame index.
 * @returns The frame index, its time in seconds, and its weighted layers.
 */
export function sampleProductionRenderFrame(
  timeline: IAutoMovieFilmTimeline,
  globalFrame: number,
): IAutoMovieProductionRenderFrame {
  if (globalFrame < 0 || globalFrame >= timeline.totalFrames)
    throw new Error(
      `Film-global frame ${globalFrame} is outside 0..${timeline.totalFrames - 1}.`,
    );
  let low: number = 0;
  let high: number = timeline.segments.length;
  while (low < high) {
    const middle: number = Math.floor((low + high) / 2);
    if (timeline.segments[middle]!.startFrame <= globalFrame) low = middle + 1;
    else high = middle;
  }
  const index: number = low - 1;
  if (index < 0 || globalFrame >= timeline.segments[index]!.endFrame)
    throw new Error(
      `Film-global frame ${globalFrame} has no builder-owned video segment.`,
    );
  const current: IAutoMovieFilmTimelineSegment = timeline.segments[index]!;
  const offset: number = globalFrame - current.startFrame;
  const incoming: IAutoMovieProductionRenderLayer = {
    shot: current.shot,
    sourceFrame: current.sourceInFrame + offset,
    weight: 1,
  };
  if (
    current.transitionIn.kind === "dissolve" &&
    offset < current.transitionIn.durationFrames
  ) {
    const previous: IAutoMovieFilmTimelineSegment | undefined =
      timeline.segments[index - 1];
    if (previous === undefined)
      throw new Error(
        `Segment "${current.shot}" dissolves without an outgoing segment.`,
      );
    const alpha: number = offset / current.transitionIn.durationFrames;
    return frame(timeline, globalFrame, [
      {
        shot: previous.shot,
        sourceFrame:
          previous.sourceOutFrame -
          current.transitionIn.durationFrames +
          offset,
        weight: 1 - alpha,
      },
      { ...incoming, weight: alpha },
    ]);
  }
  const fadeIn: number =
    current.transitionIn.kind === "fade" &&
    offset < current.transitionIn.durationFrames
      ? offset / current.transitionIn.durationFrames
      : 1;
  const remaining: number = current.endFrame - globalFrame;
  const fadeOut: number =
    current.transitionOut.kind === "fade" &&
    remaining <= current.transitionOut.durationFrames
      ? remaining / current.transitionOut.durationFrames
      : 1;
  return frame(timeline, globalFrame, [
    { ...incoming, weight: Math.min(fadeIn, fadeOut) },
  ]);
}

/** Stamp layers with independently computed binary64 time at the rational rate. */
function frame(
  timeline: IAutoMovieFilmTimeline,
  globalFrame: number,
  layers: IAutoMovieProductionRenderLayer[],
): IAutoMovieProductionRenderFrame {
  const frameRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(timeline);
  return {
    globalFrame,
    timelineFrame: globalFrame,
    timeSeconds: (globalFrame * frameRate.denominator) / frameRate.numerator,
    layers,
  };
}
