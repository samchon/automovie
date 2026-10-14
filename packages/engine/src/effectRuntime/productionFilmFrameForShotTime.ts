import {
  IAutoMovieFilmTimelineSegment,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { IAutoMovieFilmEffectClock } from "./IAutoMovieFilmEffectClock";
import { estimateProductionFilmFrame } from "./estimateProductionFilmFrame";
import { productionFilmEffectTimelineFrameRate } from "./productionFilmEffectTimelineFrameRate";

/**
 * Map one shot-local review time to its only realized film frame.
 *
 * A shot page and a review capture know a shot and a second, not a film
 * frame. The second is first mapped to the source frame that owns it, the
 * largest frame whose exact boundary time is at or before it; film-owned state
 * at that second exists only when the edit realizes that source frame of the
 * shot exactly once, so an absent or repeated occurrence answers `null` rather
 * than choosing one occurrence. A negative, non-finite or unrepresentable time
 * also answers `null`, while an inconsistent clock throws
 * `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`. The answer
 * depends only on the compiled timeline, never on whether a render has
 * prepared any other runtime.
 *
 * @evidence contracts/common.md#principled-implementation Source-frame ownership uses the half-open rule `boundary(f) <= t < boundary(f + 1)` on exact `productionFrameBoundaryToSeconds` values, starting from a float estimate and walking to the frame the comparison selects, so a time one ulp below a boundary stays in the earlier frame; segments map a source frame `s` in `[sourceInFrame, sourceOutFrame)` to film frame `startFrame + s - sourceInFrame`.
 * @evidence contracts/common.md#clear-and-simple-design One question, shot and second in and film frame out, over the minimal clock type; the frame search is a private helper because only this mapping needs the floor direction. The function currently has no production caller, only its test, which leaves its review-page consumer as an open gap rather than wiring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A repeated occurrence returns `null` rather than the first match, and an unrepresentable time returns `null` rather than a clamped frame, so the caller never reads film state from an arbitrarily chosen cut.
 * @evidence contracts/common.md#meaningful-documentation States the source-frame ownership rule, when the answer is `null`, which input throws and with which code, and that the answer depends only on the compiled timeline.
 * @evidence contracts/performance.md#efficient-algorithms Constant work to estimate the source frame plus a walk of at most a few frames, then one pass over the `G` segments to count occurrences, `O(G)` in all; the scan is needed because segments are not indexed by shot.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure query per call; a caller asking many times on one timeline repeats only the rate resolution and segment scan, which no shared index currently amortizes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one small candidate array per call and keeps no reference to the timeline after returning.
 */
export const productionFilmFrameForShotTime = (props: {
  timeline: IAutoMovieFilmEffectClock;
  shot: string;
  time: number;
}): number | null => {
  const frameRate: IAutoMovieProductionFrameRate =
    productionFilmEffectTimelineFrameRate(props.timeline);
  if (Number.isFinite(props.time) === false || props.time < 0) return null;
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

/**
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
