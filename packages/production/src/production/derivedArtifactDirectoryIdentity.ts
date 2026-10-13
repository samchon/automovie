import type { BigIntStats, Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";

/**
 * A non-symlink directory is required before bigint stat device/inode values form the identity key.
 *
 * @evidence contracts/common.md#principled-implementation A non-symlink directory is required before bigint stat device/inode values form the identity key.
 * @evidence contracts/common.md#clear-and-simple-design Root and parent publication fences use the same metadata spelling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The initial lstat and subsequent stat are separate observations, and metadata identity does not establish permanent uniqueness.
 * @evidence contracts/common.md#meaningful-documentation States physical-directory refusal and decimal bigint device/inode composition.
 * @evidence contracts/performance.md#efficient-algorithms Two metadata operations and fixed-count bigint formatting dominate work; filesystem latency is not bounded locally.
 * @evidence contracts/performance.md#reuse-equivalent-work The writer stores the first identity and compares fresh subsequent identities; no global stat cache hides replacements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the identity string escapes; metadata calls acquire no retained descriptor.
 */
export const derivedArtifactDirectoryIdentity: (directory: string) => string = (directory: string): string => {
    const linked: Stats = fileSystem.lstatSync(directory);
    if (linked.isSymbolicLink() || linked.isDirectory() === false)
        throw new Error(`Owned directory "${directory}" is not physical.`);
    const status: BigIntStats = fileSystem.statSync(directory, { bigint: true });
    return `${status.dev}\0${status.ino}`;
};
