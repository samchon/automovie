import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactIsInside } from "./derivedArtifactIsInside";

/**
 * Contained parent segments must each lstat as a non-symlink directory and realpath within the physical root.
 *
 * @evidence contracts/common.md#principled-implementation Contained parent segments must each lstat as a non-symlink directory and realpath within the physical root.
 * @evidence contracts/common.md#clear-and-simple-design Physical reads and leaf checks share this ancestry admission without creating missing directories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate observes current paths but does not pin the ancestry against concurrent replacement between system calls.
 * @evidence contracts/common.md#meaningful-documentation States non-mutating ancestry checks and native missing/error propagation.
 * @evidence contracts/performance.md#efficient-algorithms Visits D segments with lstat/realpath and path resolution; temporary strings scale with path length.
 * @evidence contracts/performance.md#reuse-equivalent-work Every physical access obtains fresh ancestry observations; old directory spelling is not an equivalent physical identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Metadata calls retain no descriptor or task; only errors escape and no directory is created.
 */
export const derivedArtifactAssertPhysicalDirectory: (root: string, directory: string) => void = (root: string, directory: string): void => {
    const relative: string = path.relative(root, path.resolve(directory));
    if (relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative))
        throw new Error(`Owned directory "${directory}" escapes project root.`);
    let current: string = root;
    for (const segment of relative.split(path.sep)) {
        current = path.join(current, segment);
        const linked: Stats | null = derivedArtifactLstatOrNull(current);
        if (linked === null) {
            throw new Error(`Owned directory "${current}" is missing.`);
        }
        if (linked.isSymbolicLink() || linked.isDirectory() === false)
            throw new Error(`Owned directory "${current}" is not a physical directory.`);
        if (derivedArtifactIsInside(root, fileSystem.realpathSync(current)) === false)
            throw new Error(`Owned directory "${current}" escapes project root.`);
    }
};
