import { SUSPICIOUS } from "./SUSPICIOUS";
import { occurrenceOffsets } from "./occurrenceOffsets";
import { occurrences } from "./occurrences";
import { textLocation } from "./textLocation";

/**
 * Returns all replacement alarms confirmed against ancestor text.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Report U+FFFD and increases of fixed corruption tokens against the ancestor, including their candidate locations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Heuristic corruption alarms remain separate from exact protected-byte comparison.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ancestor counts preserve preexisting tokens; fixed signals do not claim complete language or encoding validation.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states ancestor-confirmed alarms; diagnostics expose counts and new positions.
 * @evidence contracts/development/implementation.md#efficient-algorithms For fixed T signals, ancestor and candidate scans dominate with O(K) match arrays plus location-conversion work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed token list is shared; candidate offsets serve counts and new-position diagnostics together.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned alarm strings are caller-owned; temporary offsets and locations expire with the call.
 */
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
