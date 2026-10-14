import type { Stats } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { IAutoMovieProductionManifest } from "@automovie/interface";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionProjectProjectLayout } from "./productionProjectProjectLayout";
import { productionProjectAssertOwnedRootDirectory } from "./productionProjectAssertOwnedRootDirectory";

/**
 * Admit resident project layout directories under the physical root.
 *
 * @evidence contracts/common.md#principled-implementation Required automovie/source/generated/render directories pass owned-root checks; constant content roots may be absent, but present links, files or escaping realpaths refuse. Observations do not create a race-free lease.
 * @evidence contracts/common.md#clear-and-simple-design One constructor admission composes lexical resolution, resident shape and physical containment owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional absence supports bare projects; no directory is fabricated or unsafe path treated as missing.
 * @evidence contracts/common.md#meaningful-documentation Errors identify the manifest owner; success creates no content and does not validate payload bytes.
 * @evidence contracts/performance.md#efficient-algorithms Work follows configured root count, path/ancestry depth and fresh lstat/realpath observations; it does not enumerate file payloads.
 * @evidence contracts/performance.md#reuse-equivalent-work Each open reacquires directory observations rather than caching a pathname as ownership proof.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path/record temporaries release on return/refusal; synchronous metadata APIs acquire no retained descriptor or task.
 */
export function productionProjectValidateRealOwnershipLayout(rootReal: string, root: string, manifest: IAutoMovieProductionManifest, file: string): void {
    productionProjectAssertOwnedRootDirectory(rootReal, path.join(root, "automovie"));
    for (const entry of [
        ...manifest.sourceRoots.map((relative: string, index: number): { owner: string; relative: string; } => ({
            owner: `sourceRoots[${index}]`,
            relative,
        })),
        { owner: "generatedRoot", relative: manifest.generatedRoot },
        { owner: "renderRoot", relative: manifest.renderRoot },
    ]) {
        const absolute: string = resolveInside(root, entry.relative);
        productionProjectAssertOwnedRootDirectory(rootReal, absolute);
    }
    for (const [index, relative] of productionProjectProjectLayout.contentRoots.entries()) {
        const absolute: string = resolveInside(root, relative);
        const linked: Stats | null = lstatOrNull(absolute);
        // Absence is a shape, not a fault. The layout is one constant covering both
        // a scaffolded production and a bare project that a legacy import or a
        // first compile just created, and only the first carries viewer, scripts,
        // and public. This requirement read as existence while the layout was a
        // per-project file: declaring a content root there was the project's own
        // claim to have it. A constant claims nothing on a project's behalf, so
        // what survives is the escape it was written to refuse.
        if (linked === null)
            continue;
        if (linked.isSymbolicLink() || linked.isDirectory() === false)
            throw new Error(`Invalid production manifest "${file}": contentRoots[${index}] "${relative}" must be a physical project directory rather than a link or a file.`);
        const real: string = fileSystem.realpathSync(absolute);
        if (isInside(rootReal, real) === false)
            throw new Error(`Invalid production manifest "${file}": contentRoots[${index}] "${relative}" escapes the project through a directory junction.`);
    }
}
