import { isRecord } from "@automovie/engine";
import type { IAutoMovieShot } from "@automovie/interface";

/**
 * Read the played duration in seconds from an already object-checked sequence entry. A numeric trim duration takes precedence; absence of a referenced shot returns null so the sequence owner cannot invent an adjacent span.
 *
 * @evidence contracts/common.md#principled-implementation A trim selects its stated played span and an untrimmed entry uses the registered shot duration; missing registry resolution yields null because no valid adjacent span exists to compare.
 * @evidence contracts/common.md#clear-and-simple-design This projection selects duration while validateTrim and validateSequenceArtifact own range and adjacency admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing shots receive no fabricated duration and numeric trim values remain unchanged for their owner's validation.
 * @evidence contracts/common.md#meaningful-documentation Gives seconds, object-admission premise, trim precedence and unresolved-shot meaning.
 * @evidence contracts/performance.md#efficient-algorithms Fixed field checks take constant time and return one number or null without allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The helper projects one entry's already available data and coordinates no repeated work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No entry, shot or other state is retained after return.
 */
export function entryDuration(entry: Record<string, unknown>, shot: IAutoMovieShot | undefined): number | null {
  if (shot === undefined) return null;
  if (isRecord(entry.trim) && typeof entry.trim.duration === "number")
    return entry.trim.duration;
  return shot.duration;
}
