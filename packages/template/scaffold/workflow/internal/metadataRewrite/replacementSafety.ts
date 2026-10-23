import { SUSPICIOUS } from "./SUSPICIOUS";
import { occurrenceOffsets } from "./occurrenceOffsets";
import { occurrences } from "./occurrences";
import { textLocation } from "./textLocation";

/** Returns all replacement alarms confirmed against ancestor text. */
export function replacementSafety(
  file: string,
  side: string,
  ancestor: string,
  candidate: string,
): string[] {
  const diagnostics: string[] = [];
  const replacement: number = candidate.indexOf("\uFFFD");
  if (replacement !== -1)
    diagnostics.push(
      `${file}: ${side} contains the Unicode replacement character at ${textLocation(candidate, replacement)}.`,
    );
  if (side === "ancestor") return diagnostics;

  for (const token of SUSPICIOUS) {
    const previous: number = occurrences(ancestor, token);
    const currentOffsets: number[] = occurrenceOffsets(candidate, token);
    if (currentOffsets.length > previous) {
      const offset: number = currentOffsets[previous];
      diagnostics.push(
        `${file}: suspicious replacement sequence ${JSON.stringify(token)} increased from ${previous} to ${currentOffsets.length} at candidate ${textLocation(candidate, offset)}; confirm against the clean ancestor bytes.`,
      );
    }
  }
  return diagnostics;
}
