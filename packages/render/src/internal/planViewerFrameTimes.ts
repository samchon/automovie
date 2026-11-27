import type { IAutoMoviePlanViewerFrameTimesRequest } from "@automovie/interface";

import { countEncodedFrames } from "../timing/internal/countEncodedFrames";

/*
 * Plan the film seconds whose frames a still capture writes.
 *
 * Give either explicit `at` seconds, or a `from`–`to` range sampled every
 * `every` frames or every `step` seconds. Range samples are aligned to the
 * encoded frame grid at `fps`, so each still matches a frame the video encodes;
 * explicit seconds are kept as given. The result is sorted, without repeats,
 * and every second lies in `[0, durationSeconds]`.
 */
export function planViewerFrameTimes(
  request: IAutoMoviePlanViewerFrameTimesRequest,
): number[] {
  const fps: number = request.fps;
  const durationSeconds: number = request.durationSeconds;
  if (!Number.isFinite(fps) || fps <= 0)
    throw new Error("fps must be positive and finite");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new Error("durationSeconds must be positive and finite");
  const inFilm: (seconds: number) => boolean = (seconds: number): boolean =>
    seconds >= 0 && seconds <= durationSeconds;
  const ranged: boolean =
    request.from !== undefined ||
    request.to !== undefined ||
    request.every !== undefined ||
    request.step !== undefined;
  if ((request.at !== undefined) === ranged)
    throw new Error("Give either at seconds or a from-to range, not both");

  if (request.at !== undefined) {
    if (request.at.length === 0)
      throw new Error("at needs at least one second");
    for (const seconds of request.at)
      if (!inFilm(seconds))
        throw new Error(`${seconds} lies outside 0-${durationSeconds} s`);
    return [...new Set(request.at)].sort(
      (a: number, b: number): number => a - b,
    );
  }

  const from: number | undefined = request.from;
  const to: number | undefined = request.to;
  const every: number | undefined = request.every;
  const step: number | undefined = request.step;
  if (from === undefined || to === undefined)
    throw new Error("A range needs both from and to");
  if (!inFilm(from) || !inFilm(to) || from > to)
    throw new Error(
      `The range must satisfy 0 <= from <= to <= ${durationSeconds}`,
    );
  if ((every === undefined) === (step === undefined))
    throw new Error("A range needs exactly one of every or step");
  if (every !== undefined && (!Number.isSafeInteger(every) || every <= 0))
    throw new Error("every must be a positive whole number of frames");
  if (step !== undefined && (!Number.isFinite(step) || step <= 0))
    throw new Error("step must be positive and finite");

  const first: number = Math.max(0, Math.ceil(from * fps - 1e-9));
  const last: number = Math.min(
    countEncodedFrames(fps, durationSeconds) - 1,
    Math.floor(to * fps + 1e-9),
  );
  if (first > last) return [];

  const frames: number[] = [];

  // Sub-frame intervals reach every rounded frame without adding new instants.
  if (every !== undefined || (step !== undefined && step * fps < 1)) {
    const interval: number = every ?? 1;
    for (let index: number = first; index <= last; index += interval)
      frames.push(index);
  } else if (step !== undefined) {
    for (let sample: number = 0; ; sample++) {
      const index: number = Math.round((from + sample * step) * fps);
      if (index > last) break;
      if (index >= first && frames.at(-1) !== index) frames.push(index);
    }
  }
  return frames.map((index: number): number => index / fps);
}
