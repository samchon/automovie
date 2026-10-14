import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieProductionProjectDirectoryIdentity as IPhysicalDirectoryIdentity } from "./IAutoMovieProductionProjectDirectoryIdentity";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { BigIntStats, Stats } from "node:fs";

/**
 * Observe device/inode identity only for a currently physical directory entry.
 *
 * @evidence contracts/common.md#principled-implementation Final-entry lstat rejects links/nondirectories or absence, then BigInt stat preserves exact device/inode values as decimal strings.
 * @evidence contracts/common.md#clear-and-simple-design One observation owner supplies ancestry capture and rechecks; lexical containment remains a separate path owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names and timestamps do not substitute for native identity; lstat/stat are separate observations and do not establish race-free continued ownership.
 * @evidence contracts/common.md#meaningful-documentation Defines null cases, exact native components and unchanged propagation of nonabsence storage errors.
 * @evidence contracts/performance.md#efficient-algorithms At most one lstat and one BigInt stat plus component string conversion dominate host work; no directory entries are enumerated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ancestry fences need current native observations rather than cached path identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two identity strings escape; stat snapshots are temporary and no descriptor remains open here.
 */
export function productionProjectPhysicalDirectoryIdentityOrNull(directory: string): IPhysicalDirectoryIdentity | null {
    const linked: Stats | null = lstatOrNull(directory);
    if (linked === null ||
        linked.isSymbolicLink() ||
        linked.isDirectory() === false)
        return null;
    const status: BigIntStats = fileSystem.statSync(directory, { bigint: true });
    return {
        device: status.dev.toString(),
        inode: status.ino.toString(),
    };
}
