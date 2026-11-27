import {
  IAutoMovieFilmTimelineSegment,
  type IAutoMovieProductionFilmFrameForShotTime,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../../film/internal/productionFrameBoundaryToSeconds";
import { estimateProductionFilmFrame } from "./estimateProductionFilmFrame";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";

/*
 * Map one shot-local review time to its only realized film frame.
 *
 * A shot page and a review capture know a shot and a second, not a film frame.
 * The second is first mapped to the source frame that owns it, the largest
 * frame whose exact boundary time is at or before it; film-owned state at that
 * second exists only when the edit realizes that source frame of the shot
 * exactly once, so an absent or repeated occurrence answers `null` rather than
 * choosing one occurrence. A negative, non-finite or unrepresentable time also
 * answers `null`, while an inconsistent clock throws
 * `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`. The
 * answer depends only on the compiled timeline, never on whether a render has
 * prepared any other runtime.
 */
export const productionFilmFrameForShotTime = (
  props: IAutoMovieProductionFilmFrameForShotTime.IProps,
): number | null => {
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectTimelineFrameRate(props.timeline);
  if (props.time < 0) return null;
  const sourceFrame: number | null = lastFrameAtOrBefore(props.time, frameRate);
  if (sourceFrame === null) return null;
  const candidates: IAutoMovieFilmTimelineSegment[] =
    props.timeline.segments.filter(
      (segment: IAutoMovieFilmTimelineSegment): boolean =>
        segment.shot === props.shot &&
        sourceFrame >= segment.sourceInFrame &&
        sourceFrame < segment.sourceOutFrame,
    );
  if (candidates.length !== 1) return null;
  const segment: IAutoMovieFilmTimelineSegment = candidates[0]!;
  return segment.startFrame + sourceFrame - segment.sourceInFrame;
};

/*
 * The largest frame whose exact boundary time is at or before a nonnegative
 * finite `seconds`, or `null` when no safe-integer frame can own it.
 */
const lastFrameAtOrBefore = (
  seconds: number,
  frameRate: IAutoMovieProductionFrameRate,
): number | null => {
  let frame: number | null = estimateProductionFilmFrame(
    seconds,
    frameRate,
    Math.floor,
  );
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
