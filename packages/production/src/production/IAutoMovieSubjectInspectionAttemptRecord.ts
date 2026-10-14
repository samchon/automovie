

/**
 * Retain one ordered sweep attempt's terminal or unfinished outcome and admitted record paths.
 *
 * @evidence contracts/common.md#principled-implementation Attempt number, closed verdict, nullable reason and record paths describe one journal entry.
 * @evidence contracts/common.md#clear-and-simple-design Per-view paths remain distinct from whole-sweep verdict so failed attempts can preserve admitted prefixes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The parser requires ordinal numbering and passed iff null reason, but the schema itself neither verifies paths nor bounds history.
 * @evidence contracts/common.md#meaningful-documentation Only a completed sweep normally has passed/null; interrupted initialization stays not-run with its reason.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Journal admission and repeated full-file publication execute in transaction owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Capture/reopen share the same history entry rather than reconstructing prior terminal outcomes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The disk owner retains path/reason arrays indefinitely unless removed; this erased record implements no eviction.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionAttemptRecord {
  /** Stable monotonic attempt number inside one plan identity. */
  attempt: number;

  /** Terminal sweep outcome; only passed observations enter coverage. */
  verdict:
    | "passed"
    | "failed"
    | "unsupported"
    | "not-run"
    | "runtime-unidentified";

  /** Exact terminal reason, null only for a completed sweep. */
  reason: string | null;

  /** Passed observation records published before the terminal outcome. */
  observations: string[];
}
