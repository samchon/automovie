import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { derivedArtifactAssertPhysicalDirectory } from "./derivedArtifactAssertPhysicalDirectory";
import { derivedArtifactIsInside } from "./derivedArtifactIsInside";

/**
 * Physical parent ancestry, a regular non-symlink leaf and in-root realpath are observed before reading exact bytes.
 *
 * @evidence contracts/common.md#principled-implementation Physical parent ancestry, a regular non-symlink leaf and in-root realpath are observed before reading exact bytes.
 * @evidence contracts/common.md#clear-and-simple-design Generation and inspection use one physical byte reader below canonical path resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pathname can change between observations and readFileSync; this code does not claim descriptor-pinned hostile-writer isolation.
 * @evidence contracts/common.md#meaningful-documentation States regular-file, physical ancestry and containment refusals plus fresh byte ownership.
 * @evidence contracts/performance.md#efficient-algorithms Includes D ancestor metadata observations, realpath and reading B bytes with proportional result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A current read is required for each basis fence; earlier byte equality alone cannot replace physical admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous byte array transfers to the caller; no descriptor is retained by this path-based reader.
 */
export const derivedArtifactReadPhysicalFile: (root: string, file: string) => Uint8Array = (root: string, file: string): Uint8Array => {
    derivedArtifactAssertPhysicalDirectory(root, path.dirname(file));
    const linked: Stats = fileSystem.lstatSync(file);
    if (linked.isSymbolicLink() || linked.isFile() === false)
        throw new Error(`Owned file "${file}" is not a physical regular file.`);
    const real: string = fileSystem.realpathSync(file);
    if (derivedArtifactIsInside(root, real) === false)
        throw new Error(`Owned file "${file}" escapes the physical project root.`);
    return fileSystem.readFileSync(real);
};
