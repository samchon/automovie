import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";
import { playbackCursor } from "./playbackCursor";
import { sequenceTimeline } from "./sequenceTimeline";

/**
 * The whole film as one on-screen sample per output frame.
 *
 * There are `round(runtime × fps)` frames sampled at `i / fps`, the same schedule as the render plan's frameTimes. For a feasible nonempty frame population, the final scheduled instant precedes runtime up to floating rounding. A render host drives its per-frame capture from this list: pose the live shot's scene at `time`, blend the outgoing tail when a dissolve is in flight, and write the frame. A non-finite or non-positive `fps` throws an `Error`, and {@link sequenceTimeline} throws for a sequence it cannot lay out, such as an empty one or an unknown shot. Frame storage is uncapped; an excessive count can exceed Array.from's allocation limits.
 *
 * @param sequence The cut to play.
 * @param shots The compiled shots the cut references.
 * @returns One sample per output frame, in frame order.
 *
 * @evidence contracts/common.md#principled-implementation Computes each instant independently by binary64 division i/fps, avoiding cumulative addition drift without promising exact rationals or cross-host rendered bytes. A forward cursor reads this nondecreasing schedule; in exact arithmetic a nonempty rounded frame population ends before runtime, while numerical rounding and feasible array size remain limits.
 * @evidence contracts/common.md#clear-and-simple-design Layout is `sequenceTimeline`'s and sampling is `playbackCursor`'s; this function owns only the frame schedule, which it states the same way as the render plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every frame is resolved by the same cursor with no special first or last frame; an invalid frame rate is refused rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation States the frame count and instants and their match with `frameTimes`, how a host uses the list, both thrown conditions, and the order of the result.
 * @evidence contracts/performance.md#efficient-algorithms Linear in frames plus entries: the timeline is built once and the cursor sweeps it forward once, instead of scanning every entry per frame.
 * @evidence contracts/performance.md#reuse-equivalent-work One timeline is built and shared by every frame's query through one cursor, so the layout is computed once per call rather than once per frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The timeline and cursor are dropped on return; the caller owns the returned array, one sample per frame, bounded by `round(runtime × fps)`.
 */
export function playbackFrameSamples(
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackSample[] {
  if (!Number.isFinite(sequence.fps) || !(sequence.fps > 0))
    throw new Error(
      `sequence fps must be a finite number > 0, but was ${sequence.fps}`,
    );
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    sequence,
    shots,
  );
  const count: number = Math.round(timeline.runtime * sequence.fps);
  const cursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(
    sequence,
    timeline,
  );
  return Array.from(
    { length: count },
    (_: unknown, index: number): IAutoMoviePlaybackSample =>
      cursor(index / sequence.fps),
  );
}
