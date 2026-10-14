import type { IHumanBodyConstructionProgress } from "../structures/IHumanBodyConstructionProgress";

/**
 * Format an actual completed construction boundary for worker progress display. Body, basis, stage and optional part/path are supplied by the construction owner. The colon-joined label is display text, not an escaped identity protocol, admission result or anatomical verdict.
 *
 * @evidence contracts/common.md#principled-implementation Deterministic concatenation preserves the owning progress fields, using constructor when no document identity is available.
 * @evidence contracts/common.md#clear-and-simple-design A single formatter separates structured construction progress from the transport's display label.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timer, synthetic completion percentage or inferred anatomical acceptance is generated.
 * @evidence contracts/common.md#meaningful-documentation The prose explains completed-boundary authority, optional document identity and the unescaped display-only representation.
 * @evidence contracts/performance.md#efficient-algorithms Formatting takes time and output storage proportional to the combined identifier lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Each boundary is formatted once by the caller; the pure operation keeps no cache for changing progress fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string escapes; this formatter owns no timer, subscription or retained task.
 */
export function describeConnectedBodyConstructionProgress(
  progress: IHumanBodyConstructionProgress,
): string {
  return (
    "body:" +
    progress.basis +
    ":" +
    (progress.document ?? "constructor") +
    ":" +
    progress.stage +
    (progress.part === undefined ? "" : ":" + progress.part) +
    (progress.path === undefined ? "" : ":" + progress.path)
  );
}
