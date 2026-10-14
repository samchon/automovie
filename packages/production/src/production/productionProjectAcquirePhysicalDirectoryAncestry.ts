import type { IAutoMovieProductionProjectDirectoryIdentity as IPhysicalDirectoryIdentity } from "./IAutoMovieProductionProjectDirectoryIdentity";
import type { IAutoMovieProductionProjectDirectoryAncestry as IPhysicalDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";
import path from "node:path";
import { productionProjectPhysicalDirectoryIdentityOrNull } from "./productionProjectPhysicalDirectoryIdentityOrNull";

/**
 * Capture root-inclusive physical identities along one native relative path.
 *
 * Callers separately admit lexical containment and the owned root. This walk uses platform path.resolve/relative/sep, visits root even when the target equals it, and rejects any missing, linked or non-directory entry. Its ordered snapshot does not freeze the filesystem; the assertion owner rereads every recorded path around later operations.
 *
 * @evidence contracts/common.md#principled-implementation Native relative segments define an ordered root-inclusive walk whose entries each require the shared physical-directory observation.
 * @evidence contracts/common.md#clear-and-simple-design Acquisition owns snapshot order and population while lexical containment and later currentness remain separate guards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper does not itself reject relative parent escapes; callers supply contained paths and later identity assertions do not promise race-free ownership.
 * @evidence contracts/common.md#meaningful-documentation States root-equal behavior, platform segment spelling, required containment premise and temporary snapshot meaning.
 * @evidence contracts/performance.md#efficient-algorithms D visited segments require D directory observations and O(D) records; stored path text and native path construction add their actual length costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned snapshot supplies operands to repeated fences, while acquisition is fresh for the current read or namespace scope.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns D path/identity records without descriptors; partial arrays are discarded if any observation refuses.
 */
export function productionProjectAcquirePhysicalDirectoryAncestry(root: string, directory: string): IPhysicalDirectoryAncestry {
    const rootPath: string = path.resolve(root);
    const candidate: string = path.resolve(directory);
    const relative: string = path.relative(rootPath, candidate);
    const directories: Array<IPhysicalDirectoryIdentity & {
        path: string;
    }> = [];
    let current: string = rootPath;
    for (const segment of [
        "",
        ...(relative === "" ? [] : relative.split(path.sep)),
    ]) {
        if (segment !== "")
            current = path.join(current, segment);
        const identity: IPhysicalDirectoryIdentity | null = productionProjectPhysicalDirectoryIdentityOrNull(current);
        if (identity === null)
            throw new Error(`Owned directory "${current}" is not a physical directory.`);
        directories.push({
            path: current,
            ...identity,
        });
    }
    return { directories };
}
