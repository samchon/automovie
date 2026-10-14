import type { AutoMovieProjectRevisionDecision } from "./AutoMovieProjectRevisionDecision";

/**
 * Decode an optional persisted revision; only an absent record defaults to zero.
 *
 * Present records must carry a non-negative safe integer. Malformed data stays invalid so reading it cannot reopen a project's mutation clock at zero.
 *
 * @evidence contracts/common.md#principled-implementation Number.isSafeInteger admits exact JSON integer clocks and the non-negative comparison defines their lower bound; undefined alone represents a legacy missing file.
 * @evidence contracts/common.md#clear-and-simple-design Persistence admission stays separate from successor selection and physical writes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed records are never rounded, clamped or given the missing-file default.
 * @evidence contracts/common.md#meaningful-documentation States the default, numeric domain, invalid outcome and clock-reset failure it prevents.
 * @evidence contracts/performance.md#efficient-algorithms One field read and fixed numeric checks take constant time and result space; the caller owns file reading and parsing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one supplied observation and caches no project revision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input is not retained and only scalar decision data transfers to the caller.
 */
export function decodeAutoMovieProjectRevision(value: unknown): AutoMovieProjectRevisionDecision {
  if (value === undefined) return { state: "current", revision: 0 };
  const revision: unknown = (value as { revision?: unknown } | null)?.revision;
  return typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 0
    ? { state: "current", revision }
    : { state: "invalid" };
}
