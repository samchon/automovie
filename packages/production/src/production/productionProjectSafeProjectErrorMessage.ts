

/**
 * Read a native Error message for inspection classification, using empty text when access fails.
 *
 * @evidence contracts/common.md#principled-implementation The current inspection paths provide native Error messages; instanceof and message access are guarded against throwing values. Runtime nonstring Error.message mutation remains outside that premise.
 * @evidence contracts/common.md#clear-and-simple-design A small projection keeps message access separate from the caller's heuristic classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-Error throws are not assigned invented text; caught accessor failures yield an empty message.
 * @evidence contracts/common.md#meaningful-documentation Empty means unavailable message text, not successful validation or a recovered operation.
 * @evidence contracts/performance.md#efficient-algorithms One instance check and property read do not stringify or enumerate arbitrary thrown objects.
 * @evidence contracts/performance.md#reuse-equivalent-work Each error is observed independently; no failed operation or message cache is shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the existing message string escapes; no error object, handle or task is retained.
 */
export function productionProjectSafeProjectErrorMessage(error: unknown): string {
    try {
        return error instanceof Error ? error.message : "";
    }
    catch {
        return "";
    }
}
