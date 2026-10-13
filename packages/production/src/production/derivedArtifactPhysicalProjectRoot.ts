import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { AutoMovieDerivedArtifactGenerationErrorCode } from "./AutoMovieDerivedArtifactGenerationErrorCode";
import { derivedArtifactLstatOrNull } from "./derivedArtifactLstatOrNull";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";

/**
 * Resolved root lstat must be a physical directory and realpath must equal its resolved spelling before the physical root is returned.
 *
 * @evidence contracts/common.md#principled-implementation Resolved root lstat must be a physical directory and realpath must equal its resolved spelling before the physical root is returned.
 * @evidence contracts/common.md#clear-and-simple-design Generation and inspection share root admission before resolving any owned path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Symlinks and junction resolution are refused, but path checks are observations rather than a descriptor-based immutable root lease.
 * @evidence contracts/common.md#meaningful-documentation States existing-directory requirements and the selected typed error category.
 * @evidence contracts/performance.md#efficient-algorithms Includes filesystem lstat/realpath plus root-text resolution; filesystem latency has no local bound.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted real root is reused within the attempt; a new invocation re-observes rather than trusting prior path text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the realpath string escapes and synchronous metadata calls retain no descriptor here.
 */
export const derivedArtifactPhysicalProjectRoot: (root: string, code: AutoMovieDerivedArtifactGenerationErrorCode) => string = (root: string, code: AutoMovieDerivedArtifactGenerationErrorCode): string => {
    const resolved: string = path.resolve(root);
    const linked: Stats | null = derivedArtifactLstatOrNull(resolved);
    if (linked === null ||
        linked.isSymbolicLink() ||
        linked.isDirectory() === false)
        throw new AutoMovieDerivedArtifactGenerationError(code, `Derived artifact root "${root}" must be one existing physical directory.`);
    const real: string = fileSystem.realpathSync(resolved);
    if (path.relative(real, resolved) !== "")
        throw new AutoMovieDerivedArtifactGenerationError(code, `Derived artifact root "${root}" resolves through a symlink or junction.`);
    return real;
};
