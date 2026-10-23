import { occurrenceOffsets } from "./occurrenceOffsets";

/** Counts literal non-overlapping occurrences. */
export function occurrences(text: string, token: string): number {
  return occurrenceOffsets(text, token).length;
}
