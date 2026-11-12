import type { IAutoMovieCapturePlanRequest } from "./IAutoMovieCapturePlanRequest.js";
import type { IAutoMovieCaptureTime } from "./IAutoMovieCaptureTime.js";
import type { IAutoMovieCaptureWindow } from "./IAutoMovieCaptureWindow.js";

/** Distance in frames within which a written second counts as lying on a frame, for float error in `seconds × fps`. */
const ON_GRID: number = 1e-6;

/**
 * Plan the instants a capture draws, for a drawn scene and for a video file alike: an even sampling or explicit seconds, merged with every frame within `window` frames of each event and each cut.
 *
 * The subject's frames are the indices `0` to `N - 1` with `N = ceil(durationSeconds × fps)`, frame `i` showing second `i / fps`. An even sample is moved to the nearest frame, so every still is a frame the subject encodes, and stops before `to`. An explicit second is kept as written. The frame nearest an event or a cut is `round(seconds × fps)`, and its window runs `window` frames to each side at the frame rate, cut at the first and last frame. The result is in time order with every frame once, and each window is listed with whether the bounds cut it.
 *
 * It throws for a frame rate or duration that is not positive, a sampling that starts at or after the subject's end or ends past it, an explicit second, event or cut outside `[0, durationSeconds]`, and a window that is not a whole number of frames.
 *
 * ```ts
 * planAutoMovieCaptureFrames({ durationSeconds: 4, fps: 30, sampling: { kind: "even", from: 0, to: null, rate: 5 }, events: [2], cuts: [], window: 3 });
 * // frames 0, 6, 12, ... with 57 to 63 around the event
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame grid, how each source of instants maps onto it, the window rule and its bounds, the order of the result, and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Even samples are enumerated by index from `from` rather than by summing a step, then rounded to frame indices, so floating-point drift never moves a still off the grid; windows are counted in frames, so on a 30 fps subject they hold every frame around an instant, as `.agents/skills/visual-debugging/capture.md` asks around every contact, cut and join, instead of a fixed fraction of a second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the request, gather frame indices and explicit seconds into one map keyed by what they show, then sort.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing outside the subject is clamped into it: an instant outside throws, and only a window is cut at the bounds, which the result reports.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the planned samples and window frames plus one sort of the merged instants.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one map of the planned instants, bounded by the samples plus `2 × window + 1` per event and cut.
 */
export function planAutoMovieCaptureFrames(props: {
  /** Running time of the subject in seconds. */
  durationSeconds: number;

  /** Frames per second of the subject's grid. */
  fps: number;

  /** The seconds drawn besides the windows. */
  sampling: IAutoMovieCapturePlanRequest.Sampling;

  /** Seconds of the instants the caller named. */
  events: readonly number[];

  /** Seconds of the cuts detected in a file. */
  cuts: readonly number[];

  /** Frames drawn on each side of an event or cut. */
  window: number;
}): {
  /** Every instant drawn, in time order without repeats. */
  times: IAutoMovieCaptureTime[];

  /** The frames drawn around each event, then each cut. */
  windows: IAutoMovieCaptureWindow[];
} {
  const { durationSeconds, fps, sampling, window } = props;
  if (!(Number.isFinite(fps) && fps > 0))
    throw new Error(`A capture's frame rate ${fps} is not positive`);
  if (!(Number.isFinite(durationSeconds) && durationSeconds > 0))
    throw new Error(
      `A capture's duration ${durationSeconds} s is not positive`,
    );
  if (!(Number.isSafeInteger(window) && window >= 0))
    throw new Error(
      `A capture window of ${window} frames is not a whole number`,
    );
  const count: number = Math.ceil(durationSeconds * fps - ON_GRID);
  const inside: (seconds: number) => boolean = (seconds: number): boolean =>
    Number.isFinite(seconds) && seconds >= 0 && seconds <= durationSeconds;

  // Instants keyed by what they show: a frame index, or a second between frames.
  const instants: Map<string, IAutoMovieCaptureTime> = new Map();
  const addFrame: (frame: number) => void = (frame: number): void => {
    instants.set(`f${frame}`, { seconds: frame / fps, frame });
  };
  if (sampling.kind === "at")
    for (const seconds of sampling.seconds) {
      if (!inside(seconds))
        throw new Error(
          `Capture second ${seconds} lies outside 0-${durationSeconds} s`,
        );
      const nearest: number = Math.round(seconds * fps);
      if (Math.abs(seconds * fps - nearest) < ON_GRID && nearest < count)
        addFrame(nearest);
      else instants.set(`s${seconds}`, { seconds, frame: null });
    }
  else {
    const to: number = sampling.to ?? durationSeconds;
    if (!(sampling.from < durationSeconds && to <= durationSeconds))
      throw new Error(
        `A capture sampling of ${sampling.from}-${to} s does not lie within the subject's 0-${durationSeconds} s`,
      );
    for (let sample: number = 0; ; sample++) {
      const seconds: number = sampling.from + sample / sampling.rate;
      if (seconds >= to) break;
      addFrame(Math.min(count - 1, Math.round(seconds * fps)));
    }
  }

  // Every frame around each event and cut.
  const windows: IAutoMovieCaptureWindow[] = [];
  for (const [kind, list] of [
    ["event", props.events],
    ["cut", props.cuts],
  ] as const)
    for (const seconds of list) {
      if (!inside(seconds))
        throw new Error(
          `Capture ${kind} at ${seconds} s lies outside 0-${durationSeconds} s`,
        );
      const frame: number = Math.round(seconds * fps);
      const first: number = Math.max(0, frame - window);
      const last: number = Math.min(count - 1, frame + window);
      for (let index: number = first; index <= last; index++) addFrame(index);
      windows.push({
        kind,
        seconds,
        frame,
        first,
        last,
        clipped: first !== frame - window || last !== frame + window,
      });
    }

  return {
    times: [...instants.values()].sort(
      (a: IAutoMovieCaptureTime, b: IAutoMovieCaptureTime): number =>
        a.seconds - b.seconds,
    ),
    windows,
  };
}
