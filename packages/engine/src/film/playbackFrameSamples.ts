import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

import { IAutoMoviePlaybackSample } from "./IAutoMoviePlaybackSample";
import { playbackCursor } from "./playbackCursor";
import { sequenceTimeline } from "./sequenceTimeline";

/**
 * The whole film as frame sample points: `runtime × fps` output frames (the
 * same `round` policy as the render plan's `frameTimes`), each resolved to its
 * on-screen sample. This is the deterministic seam a render host drives its
 * per-frame capture from, pose the live shot's scene at `time`, blend the
 * outgoing tail when a dissolve is in flight, write the frame.
 */
export const playbackFrameSamples = (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackSample[] => {
  if (!Number.isFinite(sequence.fps) || !(sequence.fps > 0))
    throw new Error(
      `sequence fps must be a finite number > 0, but was ${sequence.fps}`,
    );

  const timeline = sequenceTimeline(sequence, shots);
  const count = Math.round(timeline.runtime * sequence.fps);
  const cursor = playbackCursor(sequence, timeline);
  return Array.from({ length: count }, (_, i) => cursor(i / sequence.fps));
};
