import type {
  IAutoMovieCaptureFramePlan,
  IAutoMovieCaptureFramePlanProps,
  IAutoMovieCaptureTime,
  IAutoMovieCaptureWindow,
} from "@automovie/interface";

/*
 * Plan the instants a capture draws, for a drawn scene and for a video file
 * alike: an even sampling or explicit seconds, merged with every frame within
 * `window` frames of each event and each cut.
 *
 * The subject's frames are the indices `0` to `N - 1` with `N =
 * ceil(durationSeconds × fps)`, frame `i` showing second `i / fps`. An even
 * sample is moved to the nearest frame, so every still is a frame the subject
 * encodes, and stops before `to`. An explicit second is kept as written. The
 * frame nearest an event or a cut is `round(seconds × fps)`, and its window
 * runs `window` frames to each side at the frame rate, cut at the first and
 * last frame. The result is in time order with every frame once, and each
 * window is listed with whether the bounds cut it.
 *
 * It throws for a frame rate or duration that is not positive, a sampling that
 * starts at or after the subject's end or ends past it, an explicit second,
 * event or cut outside `[0, durationSeconds]`, and a window that is not a whole
 * number of frames.
 *
 * ```ts
 * planCaptureFrames({
 *   durationSeconds: 4,
 *   fps: 30,
 *   sampling: { kind: "even", from: 0, to: null, rate: 5 },
 *   events: [2],
 *   cuts: [],
 *   window: 3,
 * });
 * // frames 0, 6, 12, ... with 57 to 63 around the event
 * ```
 */
export function planCaptureFrames(
  props: IAutoMovieCaptureFramePlanProps,
): IAutoMovieCaptureFramePlan {
  const { durationSeconds, fps, sampling, window } = props;
  if (!(fps > 0))
    throw new Error(`A capture's frame rate ${fps} is not positive`);
  if (!(durationSeconds > 0))
    throw new Error(
      `A capture's duration ${durationSeconds} s is not positive`,
    );
  if (!(window >= 0))
    throw new Error(
      `A capture window of ${window} frames is not a whole number`,
    );
  const count: number = Math.ceil(durationSeconds * fps - ON_GRID);
  const inside: (seconds: number) => boolean = (seconds: number): boolean =>
    seconds >= 0 && seconds <= durationSeconds;

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

/*
 * Distance in frames within which a written second counts as lying on a frame,
 * for float error in `seconds × fps`.
 */
const ON_GRID: number = 1e-6;
