

/**
 * Stable failure classes exposed without leaking persisted or provider bytes.
 *
 * Readers classify absence, schema, identity, currentness, locator, access and render corruption. The collector replaces unclassified errors with unavailable and derives built-in recovery text; this union itself sanitizes no payload.
 *
 * @evidence contracts/common.md#principled-implementation Distinct failure classes preserve the record invariant that refused without carrying arbitrary thrown-message text.
 * @evidence contracts/common.md#clear-and-simple-design Classification and recovery vocabulary are separate from physical reader logic and target/result records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown exceptions are not assumed schema or successful reads; safe diagnostic construction remains a runtime owner obligation.
 * @evidence contracts/common.md#meaningful-documentation Prose maps failure domains and states the collector's unclassified fallback without claiming type-level sanitization.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This closed union performs no exception classification or record traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Failure spelling implements no prior-result reuse or diagnostic cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no error object, payload bytes or record handle.
 * @author Samchon
 */
export type AutoMovieRepaintRecordFailureClass =
  | "absent"
  | "schema-invalid"
  | "identity-invalid"
  | "stale"
  | "unsafe-locator"
  | "unavailable"
  | "render-corrupt";
