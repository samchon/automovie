import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { derivedArtifactIsInside } from "./derivedArtifactIsInside";

/**
 * Contained path segments are created only when lstat observes absence; every resident segment must be a physical directory whose realpath stays in root.
 *
 * @evidence contracts/common.md#principled-implementation Contained path segments are created only when lstat observes absence; every resident segment must be a physical directory whose realpath stays in root.
 * @evidence contracts/common.md#clear-and-simple-design Generation's lock namespace and atomic-write parents share one physical directory creation owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing symlinks or non-directories are refused; partial directories created before a later failure are not rolled back.
 * @evidence contracts/common.md#meaningful-documentation States containment, create-on-absence and persistent partial-directory effects.
 * @evidence contracts/performance.md#efficient-algorithms Visits D segments with metadata/realpath and possible mkdir calls plus path-text work; no bounded wall-clock latency is asserted.
 * @evidence contracts/performance.md#reuse-equivalent-work Within the call each current segment is checked before proceeding; cached path existence cannot prove physical identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No descriptor is acquired; created directories persist as owned filesystem state and temporary strings expire on completion.
 */
export const derivedArtifactEnsurePhysicalDirectory: (root: string, directory: string) => void = (root: string, directory: string): void => {
    const relative: string = path.relative(root, path.resolve(directory));
    if (relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative))
        throw new Error(`Owned directory "${directory}" escapes project root.`);
    let current: string = root;
    for (const segment of relative.split(path.sep)) {
        current = path.join(current, segment);
        const linked: Stats | null = derivedArtifactLstatOrNull(current);
        if (linked === null)
            fileSystem.mkdirSync(current);
        const resident: Stats = fileSystem.lstatSync(current);
        if (resident.isSymbolicLink() || resident.isDirectory() === false)
            throw new Error(`Owned directory "${current}" is not a physical directory.`);
        if (derivedArtifactIsInside(root, fileSystem.realpathSync(current)) === false)
            throw new Error(`Owned directory "${current}" escapes project root.`);
    }
};
