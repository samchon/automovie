/**
 * Plan the film seconds whose frames a still capture writes.
 *
 * Give either explicit `at` seconds, or a `from`–`to` range sampled every
 * `every` frames or every `step` seconds. Range samples are aligned to the
 * film's frame grid at `fps`, so each still matches a frame the video encodes;
 * explicit seconds are kept as given. The result is sorted, without repeats,
 * and every second lies in `[0, durationSeconds]`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states both request forms, the frame-grid alignment of ranges, the kept explicit seconds and the result's order and bounds; each option states its unit.
 * @evidence contracts/development/implementation.md#principled-implementation A range is enumerated in whole frame indices, from the first index at or after `from` to the last at or before `to`, so floating-point step sums never drift off the encoded grid; a `step` is converted to the nearest frame index per sample and repeats are removed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure function owns request validation and enumeration; capture and naming belong to renderViewerFrames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default range or interval is invented: a request without `at` or a complete range, or with both forms, throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Enumeration is linear in the number of planned frames, plus a sort of explicit seconds; nothing scans the whole film when a short range is requested.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call plans from its arguments alone; there is no shared work to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned array is allocated, bounded by the requested range divided by its interval.
 */
export function planViewerFrameTimes(request: {
  /** Frames per second of the film's encoded grid. */
  fps: number;

  /** Film running time in seconds. */
  durationSeconds: number;

  /** Explicit film seconds, kept as given. */
  at?: readonly number[];

  /** Start of the range in film seconds, inclusive. */
  from?: number;

  /** End of the range in film seconds, inclusive. */
  to?: number;

  /** Range interval in whole frames. */
  every?: number;

  /** Range interval in seconds, rounded to the nearest frame per sample. */
  step?: number;
}): number[] {
  const fps: number = request.fps;
  const durationSeconds: number = request.durationSeconds;
  if (!Number.isFinite(fps) || fps <= 0)
    throw new Error("fps must be positive and finite");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new Error("durationSeconds must be positive and finite");
  const inFilm: (seconds: number) => boolean = (seconds: number): boolean =>
    Number.isFinite(seconds) && seconds >= 0 && seconds <= durationSeconds;
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

  // Enumerate whole frame indices so the samples stay on the encoded grid.
  const first: number = Math.ceil(from * fps - 1e-9);
  const last: number = Math.floor(to * fps + 1e-9);
  const frames: number[] = [];
  if (every !== undefined)
    for (let index: number = first; index <= last; index += every)
      frames.push(index);
  else
    for (let sample: number = 0; ; sample++) {
      const index: number = Math.round((from + sample * step!) * fps);
      if (index > last) break;
      if (index >= first && frames.at(-1) !== index) frames.push(index);
    }
  return frames.map((index: number): number => index / fps);
}
