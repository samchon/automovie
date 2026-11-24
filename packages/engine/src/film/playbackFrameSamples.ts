import {
  type IAutoMoviePlaybackSample,
  type IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { playbackCursor } from "./playbackCursor";
import { sequenceTimeline } from "./sequenceTimeline";

/**
 * The whole film as one on-screen sample per output frame.
 *
 * There are `round(runtime × fps)` frames sampled at `i / fps`, the same
 * schedule as the render plan's frameTimes. For a feasible nonempty frame
 * population, the final scheduled instant precedes runtime up to floating
 * rounding. A render host drives its per-frame capture from this list: pose the
 * live shot's scene at `time`, blend the outgoing tail when a dissolve is in
 * flight, and write the frame. A non-finite or non-positive `fps` throws an
 * `Error`, and {@link sequenceTimeline} throws for a sequence it cannot lay out,
 * such as an empty one or an unknown shot. Frame storage is uncapped; an
 * excessive count can exceed Array.from's allocation limits.
 *
 * @param sequence The cut to play.
 * @param shots The compiled shots the cut references.
 * @returns One sample per output frame, in frame order.
 */
export function playbackFrameSamples(
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackSample[] {
  if (!(sequence.fps > 0))
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
