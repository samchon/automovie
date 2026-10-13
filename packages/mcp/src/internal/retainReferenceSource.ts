import type { ParsedReference } from "./ParsedReference";

type Interval = ParsedReference["annotations"][number];

/**
 * Project an original interval outside the parsed snapshot's ordered comment intervals. Parser heading labels and content reads use the same lossless slices; no non-comment character is regenerated or normalized. The caller supplies original UTF-16 offsets from that snapshot.
 *
 *
 * @evidence contracts/common.md#principled-implementation Binary search finds the first intersecting ordered comment interval, then original source slices retain every noncomment character within the caller's UTF-16 span.
 * @evidence contracts/common.md#clear-and-simple-design Heading labels and content projection share one lossless omission operation instead of reconstructing Markdown.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only recognized comment intersections are removed; noncomment syntax and line endings are never normalized.
 * @evidence contracts/common.md#meaningful-documentation The comment states source-span premises and unchanged characters; returned spans reconstruct content and identify omitted annotations.
 * @evidence contracts/performance.md#efficient-algorithms For A ordered comments and K intersections, selection costs O(log A plus K plus retained text length), with one output string and O(K) span arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's parsed annotation order is reused for all projections of that snapshot; no independent parser is invoked here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned content and spans transfer to the view owner; this helper retains no source snapshot beyond its call.
 */
export function retainReferenceSource(
  source: string,
  annotations: readonly Interval[],
  interval: Interval,
): {
  content: string;
  contentRanges: Interval[];
  annotationRanges: Interval[];
} {
  let cursor: number = interval.start;
  const contentRanges: Interval[] = [];
  const annotationRanges: Interval[] = [];
  let low: number = 0;
  let high: number = annotations.length;
  while (low < high) {
    const middle: number = Math.floor((low + high) / 2);
    if (annotations[middle].end <= interval.start) low = middle + 1;
    else high = middle;
  }
  for (
    let index: number = low;
    index < annotations.length && annotations[index].start < interval.end;
    ++index
  ) {
    const annotation: Interval = annotations[index];
    const start: number = Math.max(annotation.start, interval.start);
    const end: number = Math.min(annotation.end, interval.end);
    if (cursor < start) contentRanges.push({ start: cursor, end: start });
    annotationRanges.push({ start, end });
    cursor = end;
  }
  if (cursor < interval.end)
    contentRanges.push({ start: cursor, end: interval.end });
  return {
    content: contentRanges
      .map((piece: Interval) : string => source.slice(piece.start, piece.end))
      .join(""),
    contentRanges,
    annotationRanges,
  };
}
