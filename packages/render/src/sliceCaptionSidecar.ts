import {
  IAutoMovieCaptionEntry,
  IAutoMovieCaptionSidecar,
} from "./captionSidecar";

/**
 * Slice a caption sidecar to one chunk's window `[frameStart, frameEnd)`, with spans clipped to the window and re-based to chunk-local frame indices.
 *
 * This is the caption counterpart of `planChunkedSequenceRender`'s frame-atomic chunking, so each chunk render carries its own caption track. A `frameEnd` past the sidecar's coverage is clamped to `frameCount`, which is how the last, shorter chunk is sliced. Throws when `frameStart` is not a non-negative integer, when `frameEnd` is not an integer above `frameStart`, or when `frameStart` is at or beyond `frameCount`, which means the render and the caption plan disagree on the frame count, for example because they were planned at different fps. The input spans must be in play order and tile the frames, as `planCaptionSidecar` and this function produce them.
 *
 * @evidence contracts/common.md#principled-implementation Spans are sorted, contiguous half-open intervals, so a binary search finds the first span ending after `frameStart`, and spans are then clipped with `max` and `min` until one starts at or after the clamped end; clipping cannot empty a visited span because each one overlaps the window.
 * @evidence contracts/common.md#clear-and-simple-design The slicer reads only the sidecar, not the chunk plan, so a host can pair any chunk window with its caption track; the clamp is a named helper because the coverage refusal and the clamp are separate rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A window beyond coverage throws instead of returning an empty or negative-length slice, and no window or sidecar is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the clipping and re-basing, the clamp for the last chunk, each refusal, and the frame-count mismatch a coverage refusal signals.
 * @evidence contracts/performance.md#efficient-algorithms For S spans and K spans overlapping one window, bisection plus clipping costs O(log(S+1) + K). For C contiguous chunk windows that partition the coverage, each internal boundary adds at most one repeated span visit, so total work is O(C log(S+1) + S); a single long span can still appear in all C outputs, and no span or chunk count cap is imposed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call slices one window; chunk windows are disjoint, so there is no equivalent result to reuse between calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains nothing; the returned sidecar, owned by the caller, holds exactly the K overlapping spans as new objects and never aliases the input's spans.
 */
export const sliceCaptionSidecar: (
  sidecar: IAutoMovieCaptionSidecar,
  frameStart: number,
  frameEnd: number,
) => IAutoMovieCaptionSidecar = (
  sidecar: IAutoMovieCaptionSidecar,
  frameStart: number,
  frameEnd: number,
): IAutoMovieCaptionSidecar => {
  if (!Number.isInteger(frameStart) || frameStart < 0)
    throw new Error(
      `frameStart must be a non-negative integer, but was ${frameStart}`,
    );
  if (!Number.isInteger(frameEnd) || frameEnd <= frameStart)
    throw new Error(
      `frameEnd must be an integer > frameStart, but was ${frameEnd}`,
    );
  if (frameStart >= sidecar.frameCount)
    throw new Error(
      `frameStart ${frameStart} is at or beyond the sidecar's ${sidecar.frameCount} frames; the render window exceeds caption coverage`,
    );

  const end: number = clampWindowEnd(frameEnd, sidecar.frameCount);
  const entries: IAutoMovieCaptionEntry[] = [];
  for (
    let index: number = firstSpanEndingAfter(sidecar.entries, frameStart);
    index < sidecar.entries.length && sidecar.entries[index]!.frameStart < end;
    ++index
  ) {
    const entry: IAutoMovieCaptionEntry = sidecar.entries[index]!;
    entries.push({
      ...entry,
      frameStart: Math.max(entry.frameStart, frameStart) - frameStart,
      frameEnd: Math.min(entry.frameEnd, end) - frameStart,
    });
  }
  return {
    target: sidecar.target,
    fps: sidecar.fps,
    frameCount: end - frameStart,
    entries,
  };
};

/** The window's exclusive end, clamped to the sidecar's frame count. */
const clampWindowEnd: (frameEnd: number, frameCount: number) => number = (
  frameEnd: number,
  frameCount: number,
): number => (frameEnd < frameCount ? frameEnd : frameCount);

/** Index of the first span whose exclusive end exceeds `frame`, by bisection. */
const firstSpanEndingAfter: (
  entries: readonly IAutoMovieCaptionEntry[],
  frame: number,
) => number = (
  entries: readonly IAutoMovieCaptionEntry[],
  frame: number,
): number => {
  let low: number = 0;
  let high: number = entries.length;
  while (low < high) {
    const middle: number = (low + high) >>> 1;
    if (entries[middle]!.frameEnd > frame) high = middle;
    else low = middle + 1;
  }
  return low;
};
