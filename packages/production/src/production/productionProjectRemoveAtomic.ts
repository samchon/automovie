import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { recoverProductionAtomicDelete } from "./productionMutation";
import { productionProjectTemporaryPath } from "./productionProjectTemporaryPath";
import { productionProjectRenameContendedAtomic } from "./productionProjectRenameContendedAtomic";
import { productionProjectRemoveContendedAtomic } from "./productionProjectRemoveContendedAtomic";

/**
 * Quarantine an existing target before acknowledging and removing its bytes.
 *
 * An absent target still invokes afterQuarantine. Otherwise native rename precedes that callback and final quarantine removal. Failure after renaming enters the shared recovery owner: only a still-owned namespace, retained quarantine and unoccupied original permit restoration, and successful restoration still throws the original failure. A changed or occupied namespace can leave quarantine bytes for explicit recovery; rename refusal before the try block does not invoke recovery.
 *
 * @evidence contracts/common.md#principled-implementation Absence and rename-to-quarantine paths retain publication notification order; shared guarded recovery restores only the retained unoccupied original target.
 * @evidence contracts/common.md#clear-and-simple-design This adapter supplies concrete presence/restore effects while the shared delete-recovery owner preserves original and recovery failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recovery cannot overwrite a newly occupied target or act in a replaced namespace; an absent target still reaches the transaction notification.
 * @evidence contracts/common.md#meaningful-documentation States absence behavior, rename boundary, conditional restoration and surviving quarantine on refusal.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of entry observations, renames/removal and callbacks dominates, including bounded contention waits; no payload bytes are copied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current presence and recovery fences must be observed for this deletion; earlier path state cannot replace these effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success removes quarantine; failed guarded recovery can leave it resident and propagates causal errors without retaining descriptors or tasks.
 */
export function productionProjectRemoveAtomic(file: string, afterQuarantine: () => void, guardRecovery: () => void): void {
    if (lstatOrNull(file) === null) {
        afterQuarantine();
        return;
    }
    const quarantine: string = productionProjectTemporaryPath(file, "delete");
    productionProjectRenameContendedAtomic(file, quarantine);
    try {
        afterQuarantine();
        productionProjectRemoveContendedAtomic(quarantine);
    }
    catch (error) {
        recoverProductionAtomicDelete({
            file,
            error,
            guard: guardRecovery,
            quarantined: (): boolean => lstatOrNull(quarantine) !== null,
            occupied: (): boolean => lstatOrNull(file) !== null,
            restore: (): void => productionProjectRenameContendedAtomic(quarantine, file),
        });
    }
}
