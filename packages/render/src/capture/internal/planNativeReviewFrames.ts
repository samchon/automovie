import type { AutoMovieRenderCapture } from "../AutoMovieRenderCapture";

/* Plan the review interval on an already admitted uniform native frame grid. */
export function planNativeReviewFrames(
  props: AutoMovieRenderCapture.INativeReviewFramePlanProps,
): AutoMovieRenderCapture.INativeReviewFramePlan {
  const [numerator, denominator] = props.frameRate;
  if (!Number.isSafeInteger(numerator) || numerator < 1 ||
      !Number.isSafeInteger(denominator) || denominator < 1)
    throw new Error("A review frame grid needs a positive exact rational rate");
  const [first, last] = props.frames;
  if (!Number.isSafeInteger(first) || first < 0 || !Number.isSafeInteger(last) || last < first || last - first >= 1_000_000)
    throw new Error("A review needs one to one million consecutive native frame addresses");
  const intervals: [number, number][] = (props.decisive ?? []).map(([start, end]) => {
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < first || end < start || end > last)
      throw new Error("A decisive interval must be within the requested native frame addresses");
    return [start, end];
  });
  intervals.sort((left, right) => left[0] - right[0]);

  // The exact maximum gap is one tenth of a second. Keep the comparison in
  // integers so three frames at 30000/1001 never pass as 0.1 seconds.
  const stride: number = Number(BigInt(numerator) / (10n * BigInt(denominator)));
  const frames = new Set<number>([first, last]);
  const step: number = Math.max(1, stride);
  for (let frame: number = first; frame < last;) {
    frames.add(frame);
    if (last - frame <= step) break;
    frame += step;
  }
  let visitedThrough: number = first - 1;
  for (const [start, end] of intervals) {
    for (let frame: number = Math.max(start, visitedThrough + 1); frame <= end; frame++)
      frames.add(frame);
    visitedThrough = Math.max(visitedThrough, end);
  }

  const ordered: number[] = [...frames].sort((left, right) => left - right);
  let gap: number = 0;
  for (let index: number = 1; index < ordered.length; index++)
    gap = Math.max(gap, ordered[index]! - ordered[index - 1]!);
  return {
    type: stride === 0 ? "source-rate-below-review" : "planned",
    frames: ordered,
    largestGap: gap === 0 ? null : [gap * denominator, numerator],
  };
}
