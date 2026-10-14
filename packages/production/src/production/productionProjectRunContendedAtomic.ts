import { productionProjectProductionAtomicContentionError } from "./productionProjectProductionAtomicContentionError";
import { productionProjectContendedAtomicAttempts } from "./productionProjectContendedAtomicAttempts";
import { productionProjectContendedAtomicPauseMs } from "./productionProjectContendedAtomicPauseMs";
import { productionProjectIsContendedAtomicError } from "./productionProjectIsContendedAtomicError";
import { productionProjectPauseAtomicRetry } from "./productionProjectPauseAtomicRetry";

/**
 * Attempt one synchronous filesystem effect under the configured contention policy.
 *
 * Success returns immediately. Noncontended failures propagate unchanged; a final contended failure becomes the typed aggregate with the final original error. Five attempts request waits of 20, 40, 60 and 80 ms, totaling 200 ms; filesystem work and host scheduling have no elapsed-time bound here. The caller must supply an operation safe to attempt again after these native failures and owns its publication accounting.
 *
 * @evidence contracts/common.md#principled-implementation Only configured code failures retry with increasing waits; final exhaustion preserves the final error and lazily obtains its operation description.
 * @evidence contracts/common.md#clear-and-simple-design One retry owner serves rename/removal while their adapters identify the actual effect and path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A retry code proves neither transience nor absence of partial effects; no generic rollback or publication-success claim follows from exhaustion.
 * @evidence contracts/common.md#meaningful-documentation States retry-safe operation premise, error identity, final-only description and nominal versus actual timing.
 * @evidence contracts/performance.md#efficient-algorithms At most A configured calls plus A-1 waits dominate host work; current A=5 and requested waits sum to 200 ms without mesh or directory scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Successful effects are never repeated; failures trigger distinct attempts rather than cached outcomes or shared effectful work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned result or final aggregate escapes; callbacks and per-wait cells are call-local and no native handle is acquired by this owner.
 */
export function productionProjectRunContendedAtomic<T>(step: () => T, describe: () => string): T {
    for (let attempt: number = 1; attempt < productionProjectContendedAtomicAttempts; ++attempt)
        try {
            return step();
        }
        catch (error) {
            if (productionProjectIsContendedAtomicError(error) === false)
                throw error;
            productionProjectPauseAtomicRetry(productionProjectContendedAtomicPauseMs * attempt);
        }
    try {
        return step();
    }
    catch (error) {
        if (productionProjectIsContendedAtomicError(error) === false)
            throw error;
        throw new productionProjectProductionAtomicContentionError([error], `${describe()} after ${productionProjectContendedAtomicAttempts} attempts against a held handle. Close whatever holds the path, then reopen the project and inspect its publication state before retrying.`);
    }
}
