

/**
 * Presence records an earlier thrown value for a temporary-directory cleanup attempt, including a non-Error or undefined primary value.
 *
 * @evidence contracts/common.md#principled-implementation unknown retains the actual primary cause, while optional record presence distinguishes failure from successful operation even when the thrown value is undefined.
 * @evidence contracts/common.md#clear-and-simple-design One record is shared by planning, publication and restoration cleanup scopes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truthiness check drops an empty/non-Error cause and no cleanup failure is represented as success.
 * @evidence contracts/common.md#meaningful-documentation States presence-versus-value meaning and primary cause retention for later aggregation.
 * @evidence contracts/performance.md#efficient-algorithms This record performs no computation and retains one reference; aggregation work belongs to the cleanup operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the original thrown value within one cleanup scope without a cross-operation error cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reference survives only as long as the cleanup scope or returned aggregate; the record owns no directory or native handle itself.
 * @author Samchon
 */
export interface legacyImporterLegacyImportCleanupFailure {
  /** Earlier operation's thrown value, preserved even when it is not an Error. */
  error: unknown;
}
