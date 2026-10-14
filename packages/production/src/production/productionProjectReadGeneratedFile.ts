import type { Stats } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AutoMovieGeneratedFileMissingError } from "./AutoMovieGeneratedFileMissingError";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";

/**
 * Read one generated resident with typed initial absence and physical builder-root fencing.
 *
 * @evidence contracts/common.md#principled-implementation Current generated-root admission and lexical containment precede lstat, final-link refusal, realpath root containment and regular-file admission in that order; the owned reader then checks complete physical ancestry and descriptor identity around its byte read.
 * @evidence contracts/common.md#clear-and-simple-design The generated read owns resident path/byte admission, while manifest ownership/digest comparisons belong to generated inspection and compile/publication consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only initial lstat absence creates AutoMovieGeneratedFileMissingError; links, unsafe roots, nonfiles and later read races retain their failures rather than becoming repairable missing output.
 * @evidence contracts/common.md#meaningful-documentation Defines typed initial absence, final-link and physical-root refusal and caller-owned returned bytes; it does not independently prove the manifest declared this file or that its digest is current.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete generated-root incarnation observations, native lstat/realpath checks and B-byte guarded read with directory-depth and descriptor fences; payload hashing/media parsing remain with consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved root/file address serves this read, while resident bytes and physical identity are observed afresh; an unchanged manifest path alone cannot authorize reuse of a prior buffer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned reader attempts primary/recheck descriptor release and propagates cleanup failures; full bytes transfer to the caller and temporary ancestry/stat/path data is not retained in the project handle.
 */
export function productionProjectReadGeneratedFile(state: AutoMovieProductionProjectState, relativePath: string): Uint8Array {
    const root: string = productionProjectGeneratedRoot(state);
    const file: string = resolveInside(root, relativePath);
    const linked: Stats | null = lstatOrNull(file);
    if (linked === null)
        throw new AutoMovieGeneratedFileMissingError(relativePath);
    if (linked.isSymbolicLink())
        throw new Error(`Generated file "${relativePath}" is a symlink or junction. Remove that link before compilation.`);
    const real: string = fileSystem.realpathSync(file);
    if (isInside(fileSystem.realpathSync(root), real) === false)
        throw new Error(`Generated file "${relativePath}" escapes the builder-owned root through a symlink or junction. Remove that link before compilation.`);
    if (linked.isFile() === false)
        throw new Error(`Generated path "${relativePath}" is not a file.`);
    return readAutoMovieProductionOwnedFile({
        root,
        directory: root,
        relative: relativePath,
    });
}
