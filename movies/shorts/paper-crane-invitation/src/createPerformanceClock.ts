import {
  cutSequence,
  resolveFromTimeline,
  sequenceTimeline,
  type IAutoMovieCut,
  type IAutoMoviePlaybackSample,
  type IAutoMoviePlaybackTimeline,
} from "@automovie/engine";
import type { IAutoMovieShot } from "@automovie/interface";

/**
 * Admit one continuous host performance and reuse Engine's output-time resolver.
 * This identity-time carrier supplies no engine skeletal clips or clearance claim;
 * the production host evaluates Human performance and owns its camera cuts.
 * The carrier is not a claim that the rendered camera remains uncut.
 * Output instants occupy [0,duration), as does encoded frame i/fps.
 *
 * @evidence contracts/common.md#implementation-and-ownership Engine cutSequence admits positive duration and frame rate, sequenceTimeline owns layout, and resolveFromTimeline owns shot-local time. The production adds finite-range admission without duplicating trim/transition arithmetic or retaining mutable animation state.
 * @evidence contracts/common.md#authoring-interface Supply duration in seconds and fps with an integral frame count. Returned sample resolves arbitrary in-range times independently of call order. The exclusive final boundary is not a captured frame and throws, as do nonfinite/out-of-range values.
 */
export function createPerformanceClock(duration: number, fps: number): {
  duration: number;
  frames: number;
  sample: (seconds: number) => IAutoMoviePlaybackSample;
} {
  if (!Number.isFinite(duration) || !Number.isFinite(fps) || duration <= 0 || fps <= 0 || !Number.isSafeInteger(duration * fps))
    throw new Error("Performance clock requires positive duration/fps and integral frames");
  const shot: IAutoMovieShot = {
    id: "continuous-performance", name: "Continuous window-bay performance",
    scene: "window-bay", camera: "audience-camera", cameraMotion: null,
    performances: [], objectMotions: [], lightMotions: [], duration,
  };
  const cut: IAutoMovieCut = cutSequence({
    sequence: { id: "paper-crane-motion", name: "Give It Back, Potter" },
    fps, entries: [{ shot: shot.id, trim: null, transition: null }],
    pacing: "One continuous exact-time host performance.",
    continuity: "No trim, transition overlap or performance restart.",
  }, [shot]);
  if (!cut.success) throw new Error(JSON.stringify(cut.violations));
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(cut.sequence, [shot]);
  return {
    duration: timeline.runtime,
    frames: duration * fps,
    /** Resolve only an encoded-domain instant; every result is independently owned. */
    sample(seconds: number): IAutoMoviePlaybackSample {
      if (!Number.isFinite(seconds) || seconds < 0 || seconds >= timeline.runtime)
        throw new Error("Performance time must be in [0,duration)");
      return resolveFromTimeline(cut.sequence, timeline, seconds);
    },
  };
}
