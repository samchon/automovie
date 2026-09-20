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
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Derives every picture sample from its integer index, the declared frame rate, and the one resolved output timeline.
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-frame-grid Numbers picture samples from zero and places sample `i` at `i / fps`; it does not decide whether an arbitrary authored time belongs to that grid.
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-time-refusal Refuses a non-finite, zero, or negative picture frame rate before deriving a frame count or sample instant.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Enumerates the finite picture grid in index order and resolves each `i / fps` instant against the same timeline.
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
