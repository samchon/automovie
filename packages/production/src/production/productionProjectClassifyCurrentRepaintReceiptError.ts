import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { productionProjectSafeProjectErrorMessage } from "./productionProjectSafeProjectErrorMessage";

/**
 * Classify a failed receipt check for inspection and recovery guidance.
 *
 * @evidence contracts/common.md#principled-implementation Native input-race identity or stale-message markers take precedence, then identity/receipt/reference markers, then output corruption; message heuristics can be ambiguous and rely on string Error messages.
 * @evidence contracts/common.md#clear-and-simple-design One classifier serves candidate inspection and selected-lineage refusal without repairing either record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A catch guards hostile instanceof behavior, but classification does not turn a failed receipt into an accepted one.
 * @evidence contracts/common.md#meaningful-documentation Returned stage/failure guides recovery; it does not prove the underlying cause independently of the thrown check.
 * @evidence contracts/performance.md#efficient-algorithms Lowercasing and fixed substring searches cost O(L) in message text with a local lowercase copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Classifies the current failure only; no receipt result is cached or replayed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local text and flags release; the caller owns a fixed-size result record.
 */
export function productionProjectClassifyCurrentRepaintReceiptError(error: unknown): {
    stage: "receipt" | "currentness" | "output";
    failure: "identity-invalid" | "stale" | "render-corrupt";
} {
    const message: string = productionProjectSafeProjectErrorMessage(error).toLowerCase();
    let inputRace: boolean = false;
    try {
        inputRace = error instanceof AutoMovieProductionInputRaceError;
    }
    catch {
        inputRace = false;
    }
    if (inputRace ||
        message.includes("stale") ||
        message.includes("current builder input"))
        return { stage: "currentness", failure: "stale" };
    if (message.includes("identity") ||
        message.includes("receipt") ||
        message.includes("attempt ledger") ||
        message.includes("execution policy") ||
        message.includes("reference"))
        return { stage: "receipt", failure: "identity-invalid" };
    return { stage: "output", failure: "render-corrupt" };
}
