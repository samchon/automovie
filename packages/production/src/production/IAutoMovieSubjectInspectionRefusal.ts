

/**
 * Distinguish an unsupported subject from failure of the optional drawing instrument.
 *
 * @evidence contracts/common.md#principled-implementation A refused reason selects the sweep's unsupported-viewpoint terminal outcome.
 * @evidence contracts/common.md#clear-and-simple-design Unsupported capability is separate from thrown capture failure and missing runtime provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No current product host implements this outcome; host page retention/disposal behavior cannot be inferred from the reason alone.
 * @evidence contracts/common.md#meaningful-documentation The supplied refusal text is quoted verbatim in the inspection diagnostic/history.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Host capability checking and terminal journal work execute in adapter/sweep owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An explicit outcome avoids retrying a subject as a fabricated drawable, without imposing a host reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only reason text persists; this erased record owns no resident instrument or cleanup operation.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionRefusal {
  /**
   * Why this instrument cannot frame the named subject.
   *
   * It is quoted to the caller verbatim, so it states what the instrument is and what would be observable instead, rather than naming an internal.
   */
  refused: string;
}
