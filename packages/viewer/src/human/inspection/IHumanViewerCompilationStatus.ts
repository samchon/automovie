/**
 * What the last compile attempts left behind.  A reported failure and last actual successful compile remain distinct facts. The error field contributes a cause to observation without supplying a complete diagnostic or retry policy.
 *
 * @evidence contracts/common.md#principled-implementation Reports newest compile-attempt failure separately from the last actual successful Human compile completion time.
 * @evidence contracts/common.md#clear-and-simple-design Keeps stale fallback visibility distinct from source revision, which may move for viewer-only edits without a Human compile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Last-good code remains explicitly older after failure; goodAt cannot certify the newest attempt or displayed source.
 * @evidence contracts/common.md#meaningful-documentation Documents null error/success time and successful Human compile completion separately from display revisions; unrelated viewer/test edits need not move this time, while reached compiler dependencies or configuration can invalidate that compile across package boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two fields add no compile work; generation scheduling and compiler process costs belong to compilation owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Status reuses last-good timestamp while current failure is updated; successful-generation reuse remains explicitly tied to its compile identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compiler owner retains one current/last-good generation and status, while callers may keep older maps; this shape retains no process.
 *
 * @author Samchon
 */
export interface IHumanViewerCompilationStatus {
  /** The failure of the newest attempt, or null when it succeeded. */
  error: string | null;

  /** When the newest successful current Human compile finished, or null before the first. Human source membership, configured inputs and recorded compiler dependencies can trigger recompilation, including dependencies outside packages/human; unrelated display revisions can change without moving this timestamp. */
  goodAt: string | null;
}
