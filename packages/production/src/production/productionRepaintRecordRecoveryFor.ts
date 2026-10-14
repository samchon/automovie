import { AutoMovieRepaintRecordFailureClass } from "./AutoMovieRepaintRecordFailureClass";

/**
 * Return the built-in recovery sentence for an admitted failure class. The complete fixed mapping is allocated per call; a foreign cast can return undefined and is rejected by the classification boundary rather than sanitized here.
 *
 * @evidence contracts/common.md#principled-implementation Failure-class lookup selects owner-authored recovery text without including reader error messages, paths or provider responses.
 * @evidence contracts/common.md#clear-and-simple-design One fixed recovery vocabulary serves construction and collector re-admission without another diagnostic policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arbitrary supplied recovery or thrown payload becomes output; supported failure membership is a caller premise for this typed lookup.
 * @evidence contracts/common.md#meaningful-documentation Prose states fixed mapping, admitted-key premise and foreign-cast behavior.
 * @evidence contracts/performance.md#efficient-algorithms Seven fixed entries are materialized for each lookup with constant-size work/storage independent of persisted record populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor and collector share one mapping definition; the collector intentionally recomputes recovery from class rather than reuse mutable Error.recovery.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary mapping expires and only its shared immutable string value escapes; no Error or reader resource is retained.
 */
export const productionRepaintRecordRecoveryFor: (failure: AutoMovieRepaintRecordFailureClass) => string = (failure: AutoMovieRepaintRecordFailureClass): string =>
  ({
    absent: "Create or restore the requested record, then inspect it again.",
    "schema-invalid":
      "Replace the record with one matching the current schema.",
    "identity-invalid": "Restore the record at its canonical identity.",
    stale: "Regenerate the record from current production inputs.",
    "unsafe-locator":
      "Replace linked or escaping state with an owned tracked record.",
    unavailable:
      "Restore access to the tracked repaint state, then inspect it again.",
    "render-corrupt": "Restore or regenerate the exact rendition bytes.",
  })[failure];
