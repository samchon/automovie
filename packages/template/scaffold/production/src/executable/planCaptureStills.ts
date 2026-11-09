/**
 * Plan the film seconds a capture draws for one interval.
 *
 * Stills fall every `1 / rate` seconds from `start`, 5 per second by default,
 * so a 10-second review segment fills one 50-cell sheet; a fast action may
 * raise the rate to at most 10. Each event second adds stills at 10 per second
 * within half a second on either side, such as around a contact. Each sample
 * in `[start, end)` is moved to the nearest frame of the film's grid, so every
 * still is a frame the video encodes; the result is sorted and without
 * repeats.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the default and maximum rates, the event window and its rate, the frame-grid alignment and the result's order and bounds; each option states its unit.
 * @evidence contracts/development/implementation.md#principled-implementation Samples are enumerated by index from `start` rather than by summing a step, then rounded to whole frame indices at `fps`, so a 10-second interval at 5 per second yields exactly 50 distinct frames and floating-point drift never moves a still off the encoded grid; event samples use the same grid and repeats are removed by frame index.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure function owns validation and sampling; drawing, view selection and sheet layout belong to the capture command.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No interval is invented: an interval outside the film, an empty interval, a rate outside (0, 10] or a non-finite event throws instead of being clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work is linear in the planned stills plus a sort of the frame indices; nothing scans the film outside the interval.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call plans from its arguments alone; there is no shared work to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the frame-index set and the returned array are allocated, bounded by the interval times the rate plus 11 stills per event.
 */
export function planCaptureStills(request: {
  /** Frames per second of the film's grid. */
  fps: number;

  /** Film running time in seconds. */
  durationSeconds: number;

  /** First second of the interval, inclusive. */
  start: number;

  /** End second of the interval, exclusive. */
  end: number;

  /** Stills per second; 5 when omitted, at most 10. */
  rate?: number;

  /** Film seconds to sample at 10 stills per second within half a second. */
  events?: readonly number[];
}): number[] {
  const { fps, durationSeconds, start, end } = request;
  const rate: number = request.rate ?? 5;
  if (!Number.isFinite(fps) || fps <= 0)
    throw new Error("fps must be positive and finite");
  if (!(0 <= start && start < end && end <= durationSeconds))
    throw new Error(
      `The interval must satisfy 0 <= start < end <= ${durationSeconds}`,
    );
  if (!(rate > 0 && rate <= 10))
    throw new Error("rate must lie in (0, 10] stills per second");
  const frames: Set<number> = new Set();
  const add = (seconds: number): void => {
    if (seconds >= start && seconds < end)
      frames.add(Math.round(seconds * fps));
  };
  const count: number = Math.round((end - start) * rate);
  for (let index: number = 0; index < count; index++) add(start + index / rate);
  for (const event of request.events ?? []) {
    if (!Number.isFinite(event))
      throw new Error("Event seconds must be finite");
    for (let offset: number = -5; offset <= 5; offset++)
      add(event + offset / 10);
  }
  return [...frames]
    .sort((a: number, b: number): number => a - b)
    .map((frame: number): number => frame / fps);
}
