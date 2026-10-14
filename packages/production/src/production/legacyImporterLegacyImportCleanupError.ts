

/**
 * AggregateError subtype preserving the earlier import operation failure before its temporary-directory cleanup failure. Throwing it means native cleanup completion remains unresolved.
 *
 * @evidence contracts/common.md#principled-implementation Uses inherited AggregateError errors storage to retain operation and cleanup causes in their actual ordering.
 * @evidence contracts/common.md#clear-and-simple-design One import-specific subtype represents combined temporary-directory failure across planning, publication and restoration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute the cleanup errno for the primary failure or declare retained temporary bytes deleted.
 * @evidence contracts/common.md#meaningful-documentation Documents inherited construction, ordered causes and cleanup-completion uncertainty.
 * @evidence contracts/performance.md#efficient-algorithms Inherited construction retains the supplied E error references and message text with O(E) error-array copying.
 * @evidence contracts/performance.md#reuse-equivalent-work Original cause objects are shared by reference rather than serialized or cloned into uninspectable strings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retaining the aggregate retains its causes, not a directory handle; physical recovery remains with the owning operation/operator after failed removal.
 */
export class legacyImporterLegacyImportCleanupError extends AggregateError {}
