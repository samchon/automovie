import type { compareCaptureStill } from "./compareCaptureStill";

/**
 * Compose the record of a round comparison, written as `comparison.json`.
 *
 * It lists every compared still with its numbers, counts the compared stills and those with at least one changed pixel, and lists under `missing` every still of the run that has no entry, which is a still the earlier round does not have.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record lists and counts and what a missing still is.
 * @evidence contracts/development/implementation.md#principled-implementation The record answers what a correction changed and what it left alone, so it keeps the stills that could not be compared apart from the stills that were compared and did not change.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One set of the compared names, one filter for the missing stills, one count.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A still without an entry is reported as missing instead of counted as unchanged, and no verdict is stored: the reader knows what was meant to change.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of stills, with a set for the name lookups.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A comparison is summarized once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record and keeps nothing.
 */
export function summarizeCaptureComparison(props: {
  /** Folder of the earlier round. */
  reference: string;

  /** Largest channel difference, in bytes, that counted as unchanged. */
  tolerance: number;

  /** File names of every still the run wrote, in order. */
  frames: readonly string[];

  /** The entries of the stills that had a counterpart, in order. */
  entries: readonly ReturnType<typeof compareCaptureStill>["entry"][];
}): {
  /** Folder of the earlier round. */
  reference: string;

  /** Largest channel difference, in bytes, that counted as unchanged. */
  tolerance: number;

  /** Number of stills that had a counterpart. */
  compared: number;

  /** Number of compared stills with at least one changed pixel. */
  changed: number;

  /** Stills the earlier round does not have. */
  missing: string[];

  /** The compared stills with their numbers. */
  frames: ReturnType<typeof compareCaptureStill>["entry"][];
} {
  const compared: Set<string> = new Set(
    props.entries.map((entry: { frame: string }): string => entry.frame),
  );
  return {
    reference: props.reference,
    tolerance: props.tolerance,
    compared: props.entries.length,
    changed: props.entries.filter(
      (entry: { changed: number }): boolean => entry.changed > 0,
    ).length,
    missing: props.frames.filter(
      (frame: string): boolean => !compared.has(frame),
    ),
    frames: [...props.entries],
  };
}
