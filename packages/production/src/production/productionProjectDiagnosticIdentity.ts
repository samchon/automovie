import { validateAutoMovieProductionGraph } from "./validateProductionDesign";

/**
 * Compare graph diagnostics by code, target, path and message.
 *
 * @evidence contracts/common.md#principled-implementation NUL joining projects the four current validator fields; nullish path becomes empty under Array.join. This is a local comparison key with no escaping guarantee for arbitrary embedded NULs.
 * @evidence contracts/common.md#clear-and-simple-design The setter uses one identity owner to distinguish previous diagnostics from newly invalidated downstream ones.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No severity-only or message-only shortcut suppresses a newly different diagnostic.
 * @evidence contracts/common.md#meaningful-documentation The key supports before/after attribution, not cryptographic provenance or complete arbitrary-text collision resistance.
 * @evidence contracts/performance.md#efficient-algorithms Four fields are joined with time/storage proportional to their combined text; graph validation cost remains with the caller.
 * @evidence contracts/performance.md#reuse-equivalent-work Previous keys share Set membership within one setter attempt; changed graph diagnostics are recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The short field array releases after joining; only the key string escapes.
 */
export function productionProjectDiagnosticIdentity(diagnostic: ReturnType<typeof validateAutoMovieProductionGraph>[number]): string {
    return [
        diagnostic.code,
        diagnostic.target,
        diagnostic.path!,
        diagnostic.message,
    ].join("\0");
}
