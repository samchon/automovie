import { productionProjectContendedAtomicCodes } from "./productionProjectContendedAtomicCodes";

/**
 * Classify only object failures carrying a configured native contention code.
 *
 * @evidence contracts/common.md#principled-implementation Object, nonnull and string-code admission precedes exact membership in the configured EPERM/EACCES/EBUSY set.
 * @evidence contracts/common.md#clear-and-simple-design One classifier serves the bounded retry owner while the code set owns supported host failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Code membership does not prove a fault is transient; permanent permissions exhaust the same bounded policy, and message text does not select retries.
 * @evidence contracts/common.md#meaningful-documentation States admitted failure shape, supported codes and the unresolved transient-versus-permanent distinction.
 * @evidence contracts/performance.md#efficient-algorithms Fixed field checks and expected constant-time set lookup allocate no input-sized collection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each thrown value is classified afresh; no previous error substitutes for a new attempt's outcome.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; the classifier retains no thrown value or filesystem resource.
 */
export function productionProjectIsContendedAtomicError(error: unknown): boolean {
    return typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as {
            code: unknown;
        }).code === "string" &&
        productionProjectContendedAtomicCodes.has((error as {
            code: string;
        }).code);
}
