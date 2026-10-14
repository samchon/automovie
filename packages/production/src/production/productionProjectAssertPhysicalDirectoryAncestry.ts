import type { IAutoMovieProductionProjectDirectoryAncestry as IPhysicalDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";
import type { IAutoMovieProductionProjectDirectoryIdentity as IPhysicalDirectoryIdentity } from "./IAutoMovieProductionProjectDirectoryIdentity";
import { productionProjectPhysicalDirectoryIdentityOrNull } from "./productionProjectPhysicalDirectoryIdentityOrNull";
import { productionProjectDirectoryIdentityKey } from "./productionProjectDirectoryIdentityKey";

/**
 * Reobserve captured directory identities and refuse the first changed path.
 *
 * @evidence contracts/common.md#principled-implementation Ordered fresh directory observations compare exact device/inode keys; null or a changed pair refuses the captured namespace.
 * @evidence contracts/common.md#clear-and-simple-design One snapshot assertion serves project namespace and scoped-read fences without adding another containment or storage owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching path spelling never replaces physical identity, and successful sequential observations do not lock later filesystem state.
 * @evidence contracts/common.md#meaningful-documentation States first-change refusal, unchanged snapshot and the absence of a continuing race-free guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Short-circuit traversal makes at most D current directory observations with key-text comparisons and constant auxiliary state.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured records are reused as expected operands, but every reached path is freshly observed rather than identity-cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Expected/current references live only during the call; the caller retains the snapshot and no handle or task escapes.
 */
export function productionProjectAssertPhysicalDirectoryAncestry(ancestry: IPhysicalDirectoryAncestry): void {
    const changed: IPhysicalDirectoryAncestry["directories"][number] | undefined = ancestry.directories.find((expected: IPhysicalDirectoryAncestry["directories"][number]): boolean => {
        const current: IPhysicalDirectoryIdentity | null = productionProjectPhysicalDirectoryIdentityOrNull(expected.path);
        return (current === null ||
            productionProjectDirectoryIdentityKey(current) !== productionProjectDirectoryIdentityKey(expected));
    });
    if (changed !== undefined)
        throw new Error(`Owned directory "${changed.path}" changed physical identity. Discard this stale project handle and reopen the physical production namespace.`);
}
