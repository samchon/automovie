import { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";
/**
 * One actor's joined line intervals, including explicit rest gaps.
 *
 * @evidence contracts/common.md#principled-implementation The join builds ordered half-open safe-integer emission ranges covering the line; the sampler selects the first containing interval and maps rest to neutral intensity zero.
 * @evidence contracts/common.md#clear-and-simple-design Line and actor identity accompany one range array, keeping timing seekable without a mutable current-frame cursor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These records neither synthesize phonemes nor prove actor lookup or mouth application; public join and sample APIs currently have test-only repository reach.
 * @evidence contracts/common.md#meaningful-documentation Identifies emission timing, gap coverage and actor identity; callers must preserve the joined ordering when holding this mutable range array.
 * @evidence contracts/performance.md#efficient-algorithms V receipt intervals yield at most 2V+1 ranges, taking O(V) retained storage; frame sampling is O(R) over the resulting R ranges.
 * @evidence contracts/performance.md#reuse-equivalent-work Ranges are compiled once per line/binding/receipt and reused across arbitrary seeks, with no independent pose or frame cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh array and records for the lifetime of the compilation; no synthesized audio or scene node is retained.
 * @author Samchon
 */
export interface IAutoMovieDialogueVisemeTimeline {
  /** Joined dialogue line identity. */
  line: string;

  /** Resolved actor node. */
  actor: string;

  /** Gap-free ranges covering the line, including explicit rest. */
  ranges: IAutoMovieDialogueMouthRange[];
}
