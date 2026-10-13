import type { ParsedReference } from "./ParsedReference";

type Interval = ParsedReference["annotations"][number];

/**
 * Project an original interval outside the parsed snapshot's ordered comment
 * intervals. Parser heading labels and content reads use the same lossless
 * slices; no non-comment character is regenerated or normalized. The caller
 * supplies original UTF-16 offsets from that snapshot.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-source Retains every original non-comment character in the requested source interval.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Returns ordered retained and omitted original intervals without rewriting source text.
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
  let cursor = interval.start;
  const contentRanges: Interval[] = [];
  const annotationRanges: Interval[] = [];
  let low = 0;
  let high = annotations.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (annotations[middle].end <= interval.start) low = middle + 1;
    else high = middle;
  }
  for (
    let index = low;
    index < annotations.length && annotations[index].start < interval.end;
    ++index
  ) {
    const annotation = annotations[index];
    const start = Math.max(annotation.start, interval.start);
    const end = Math.min(annotation.end, interval.end);
    if (cursor < start) contentRanges.push({ start: cursor, end: start });
    annotationRanges.push({ start, end });
    cursor = end;
  }
  if (cursor < interval.end)
    contentRanges.push({ start: cursor, end: interval.end });
  return {
    content: contentRanges
      .map((piece) => source.slice(piece.start, piece.end))
      .join(""),
    contentRanges,
    annotationRanges,
  };
}
