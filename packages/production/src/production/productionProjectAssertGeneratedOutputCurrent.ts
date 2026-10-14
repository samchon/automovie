import type { Dirent, Stats } from "node:fs";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { compareCodeUnits } from "./contentIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectGeneratedRoot } from "./productionProjectGeneratedRoot";
import { productionProjectReadGeneratedFile } from "./productionProjectReadGeneratedFile";

/**
 * Verify generated membership, exact member bytes and exact manifest bytes before revision publication.
 *
 * @evidence contracts/common.md#principled-implementation Directory traversal records current paths, both inventories are ordered by complete code-unit path, and guarded readers compare every supplied member and manifest; failures become InputRaceError. Sorting complete paths makes membership independent of per-directory DFS order.
 * @evidence contracts/common.md#clear-and-simple-design One output fence is used by generated publication; it neither repairs files nor publishes a revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected files or unreadable bytes refuse instead of being ignored, and metadata/path equality does not replace byte comparison.
 * @evidence contracts/common.md#meaningful-documentation Throws on inventory, payload or manifest mismatch, including undeclared residents; equal prefix-shaped populations such as a/x and a-b are admitted regardless of discovery order.
 * @evidence contracts/performance.md#efficient-algorithms Enumerates every resident entry with per-directory sorting, globally sorts actual and candidate path arrays in O(F log F) for F members, reads/copies all payload and manifest bytes and compares them, plus recursive depth and repeated ancestry checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Expected bytes/serialized manifest are borrowed from the attempt; actual bytes and metadata are freshly acquired with no persistent validation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local inventory and comparison buffers release; delegated readers close descriptors, recursion grows with tree depth, and no fixed entry/byte cap is imposed.
 */
export function productionProjectAssertGeneratedOutputCurrent(state: AutoMovieProductionProjectState, files: ReadonlyMap<string, Uint8Array>, serializedManifest: string): void {
    try {
        const root: string = productionProjectGeneratedRoot(state);
        const actualPaths: string[] = [];
        const visit: (directory: string) => void = (directory: string): void => {
            for (const entry of fileSystem
                .readdirSync(directory, { withFileTypes: true })
                .sort((left: Dirent<string>, right: Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
                const absolute: string = path.join(directory, entry.name);
                const status: Stats = fileSystem.lstatSync(absolute);
                if (status.isDirectory())
                    visit(absolute);
                else
                    actualPaths.push(normalizeSlash(path.relative(root, absolute)));
            }
        };
        visit(root);
        actualPaths.sort(compareCodeUnits);
        const expectedPaths: string[] = [...files.keys()].sort(compareCodeUnits);
        if (actualPaths.join("\0") !== expectedPaths.join("\0"))
            throw new AutoMovieProductionInputRaceError("Compiler-owned generated inventory changed while output was being published.");
        for (const [relativePath, expected] of files)
            if (Buffer.from(productionProjectReadGeneratedFile(state, relativePath)).equals(Buffer.from(expected)) === false)
                throw new AutoMovieProductionInputRaceError(`Compiler-owned generated file "${relativePath}" changed while output was being published.`);
        const residentManifest: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, "generated-manifest.json");
        if (residentManifest === null ||
            Buffer.from(residentManifest).equals(Buffer.from(serializedManifest, "utf8")) === false)
            throw new AutoMovieProductionInputRaceError("Compiler-owned generated manifest changed while output was being published.");
    }
    catch (error) {
        if (error instanceof AutoMovieProductionInputRaceError)
            throw error;
        throw new AutoMovieProductionInputRaceError(`Compiler-owned generated output became unreadable while it was being published: ${String(error)}`);
    }
}
