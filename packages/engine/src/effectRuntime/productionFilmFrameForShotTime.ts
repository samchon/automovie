import { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { IAutoMovieFilmEffectClock } from "./IAutoMovieFilmEffectClock";
import { estimateProductionFilmFrame } from "./estimateProductionFilmFrame";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";

/**
 * Map one shot-local review time to its only realized film frame.
 *
 * A shot page and a review capture know a shot and a second, not a film
 * frame. Film-owned state at that second exists only when the edit realizes
 * the shot exactly once at the source frame owning that second, so an absent
 * or repeated occurrence answers `null` rather than choosing one occurrence.
 * The answer depends only on the compiled timeline, never on whether a render
 * has prepared any other runtime.
 */
export const productionFilmFrameForShotTime = (props: {
  timeline: IAutoMovieFilmEffectClock;
  shot: string;
  time: number;
}): number | null => {
  const frameRate = productionFilmEffectTimelineFrameRate(props.timeline);
  if (Number.isFinite(props.time) === false || props.time < 0) return null;
  const sourceFrame = lastFrameAtOrBefore(props.time, frameRate);
  if (sourceFrame === null) return null;
  const candidates = props.timeline.segments.filter(
    (segment) =>
      segment.shot === props.shot &&
      sourceFrame >= segment.sourceInFrame &&
      sourceFrame < segment.sourceOutFrame,
  );
  if (candidates.length !== 1) return null;
  const segment = candidates[0]!;
  return segment.startFrame + sourceFrame - segment.sourceInFrame;
};

/**
 * The largest frame whose exact boundary time is at or before a nonnegative
 * finite `seconds`, or `null` when no safe-integer frame can own it.
 */
const lastFrameAtOrBefore = (
  seconds: number,
  frameRate: IAutoMovieProductionFrameRate,
): number | null => {
  let frame = estimateProductionFilmFrame(seconds, frameRate, Math.floor);
  if (frame === null) return null;
  while (
    frame > 0 &&
    productionFrameBoundaryToSeconds({ frame, frameRate }) > seconds
  )
    frame -= 1;
  while (
    productionFrameBoundaryToSeconds({ frame: frame + 1, frameRate }) <= seconds
  )
    frame += 1;
  return frame;
};
