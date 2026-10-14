import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectPhysicalDirectoryIdentityOrNull } from "./productionProjectPhysicalDirectoryIdentityOrNull";
import { productionProjectDirectoryIdentityKey } from "./productionProjectDirectoryIdentityKey";

/**
 * Refuse an AutoMovie state root that no longer matches the handle's captured physical directory.
 *
 * @evidence contracts/common.md#principled-implementation The existing physical-directory reader rejects absent, linked or nondirectory roots and the device/inode key must equal the constructor's automovieIdentity before the handle may continue.
 * @evidence contracts/common.md#clear-and-simple-design This guard owns state-root physical generation; project-root generation and logical production incarnation remain with their own checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A same-named replacement is not a current root and no changed identity silently resets the handle's baseline.
 * @evidence contracts/common.md#meaningful-documentation States state-root replacement refusal and the reopen correction; it does not independently validate registry membership or every descendant directory.
 * @evidence contracts/performance.md#efficient-algorithms One physical-directory observation performs at most lstat/stat plus two small key constructions; native path traversal dominates and no record bytes are loaded.
 * @evidence contracts/performance.md#reuse-equivalent-work The constructor's identity remains the expected generation, while every invocation obtains a fresh directory observation around the enclosing operation's effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed state owns the expected identity; transient stat/key values expire after comparison and no handle, cache or task is acquired.
 */
export function productionProjectAssertStateRootIdentity(state: AutoMovieProductionProjectState): void {
    const current: ReturnType<typeof productionProjectPhysicalDirectoryIdentityOrNull> = productionProjectPhysicalDirectoryIdentityOrNull(state.automovieRoot);
    if (current === null ||
        productionProjectDirectoryIdentityKey(current) !== state.automovieIdentity)
        throw new AutoMovieProductionInputRaceError("Production state root identity changed. Discard this project handle and open the physical project state again before reading or mutating it.");
}
