import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { derivedArtifactAssertPhysicalDirectory } from "./derivedArtifactAssertPhysicalDirectory";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactIsInside } from "./derivedArtifactIsInside";

/**
 * After physical parent admission, absence is permitted for publication; a present leaf must be a regular non-symlink file resolving inside root.
 *
 * @evidence contracts/common.md#principled-implementation After physical parent admission, absence is permitted for publication; a present leaf must be a regular non-symlink file resolving inside root.
 * @evidence contracts/common.md#clear-and-simple-design Atomic publication shares this target admission before and after rename.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing leaves are valid write targets rather than fabricated regular files; observation does not prohibit later replacement by external writers.
 * @evidence contracts/common.md#meaningful-documentation States nullable target existence, physical parent checks and unsafe-leaf throws.
 * @evidence contracts/performance.md#efficient-algorithms Includes D parent checks, leaf metadata and optional realpath; no byte contents are read.
 * @evidence contracts/performance.md#reuse-equivalent-work The publisher re-observes before and after rename rather than caching a leaf verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No descriptor or file is acquired by the checker; temporary path records expire on return or throw.
 */
export const derivedArtifactAssertPhysicalLeaf: (root: string, file: string) => void = (root: string, file: string): void => {
    derivedArtifactAssertPhysicalDirectory(root, path.dirname(file));
    const linked: Stats | null = derivedArtifactLstatOrNull(file);
    if (linked === null)
        return;
    if (linked.isSymbolicLink() || linked.isFile() === false)
        throw new Error(`Owned output "${file}" is not a physical regular file.`);
    if (derivedArtifactIsInside(root, fileSystem.realpathSync(file)) === false)
        throw new Error(`Owned output "${file}" escapes project root.`);
};
