import type { Dirent, Stats } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";
import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import { compareCodeUnits } from "./contentIdentity";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectProjectLayout } from "./productionProjectProjectLayout";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Snapshot source and render content bytes for compiler/currentness fingerprints.
 *
 * @evidence contracts/common.md#principled-implementation Every declared source and constant content root must be a contained physical directory; linked or escaping entries refuse, selected optional file absence is represented by null rather than empty bytes.
 * @evidence contracts/common.md#clear-and-simple-design One path-keyed map gathers all classified inputs before global code-unit sorting; root/path admission and guarded descriptor reads remain delegated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root traversal and exact bytes are not replaced by watcher quietness; overlapping roots follow existing later-write flag replacement rather than merging classifications.
 * @evidence contracts/common.md#meaningful-documentation Returns caller-owned bytes and source/render flags; absent content directories still refuse even though constructor layout admission can permit them, and the asset manifest has neither flag.
 * @evidence contracts/performance.md#efficient-algorithms Visits all selected entries, sorts each directory and final paths, performs ancestry/realpath checks and reads total B bytes; overlapping roots can repeat reads and Map replacement does not remove that cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call is a fresh snapshot; paths deduplicate the returned population but repeated traversal/read work is not cached across roots or attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns all retained B bytes and records without a fixed byte cap; replaced Map buffers become unreachable while recursive traversal retains pending directory populations and a depth-sized stack. Owned readers attempt descriptor cleanup on success/failure and report refusal rather than guaranteeing host release; no traversal cache or task survives.
 */
export function productionProjectContentInputs(state: AutoMovieProductionProjectState): IAutoMovieProductionContentInput[] {
    productionProjectAssertProjectRootIdentity(state);
    const readContent: (physicalRoot: string, file: string) => Uint8Array = (physicalRoot: string, file: string): Uint8Array => readAutoMovieProductionOwnedFile({
        root: physicalRoot,
        directory: path.dirname(file),
        relative: path.basename(file),
    });
    const inputs: Map<string, { bytes: Uint8Array | null; render: boolean; source: boolean; }> = new Map<string, {
        bytes: Uint8Array | null;
        render: boolean;
        source: boolean;
    }>();
    const setInput: (inputPath: string, bytes: Uint8Array | null, source: boolean, render: boolean) => void = (inputPath: string, bytes: Uint8Array | null, source: boolean, render: boolean): void => {
        inputs.set(inputPath, {
            bytes,
            render,
            source,
        });
    };
    const visit: (directory: string, physicalRoot: string, source: boolean, render: boolean) => void = (directory: string, physicalRoot: string, source: boolean, render: boolean): void => {
        const realDirectory: string = fileSystem.realpathSync(directory);
        if (isInside(state.rootReal, realDirectory) === false ||
            isInside(physicalRoot, realDirectory) === false)
            throw new Error(`Declared content directory "${relativeToRoot(state.root, directory)}" escapes its verified physical project root. Replace the junction with physical project content.`);
        for (const entry of fileSystem
            .readdirSync(directory, { withFileTypes: true })
            .sort((left: Dirent<string>, right: Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
            const absolute: string = path.join(directory, entry.name);
            const linked: Stats = fileSystem.lstatSync(absolute);
            if (linked.isSymbolicLink())
                throw new Error(`Declared content path "${relativeToRoot(state.root, absolute)}" is a symlink or junction. Replace it with physical project content before compilation.`);
            if (linked.isDirectory())
                visit(absolute, physicalRoot, source, render);
            else if (linked.isFile()) {
                const real: string = fileSystem.realpathSync(absolute);
                if (isInside(state.rootReal, real) === false ||
                    isInside(physicalRoot, real) === false)
                    throw new Error(`Declared content file "${relativeToRoot(state.root, absolute)}" escapes its verified physical project root. Replace the junction with a physical file.`);
                setInput(normalizeSlash(path.relative(state.root, absolute)), readContent(physicalRoot, real), source, render);
            }
        }
    };
    for (const [relativeRoot, source, render] of [
        ...state.manifest_.sourceRoots.map((root: string): readonly [string, true, false] => [root, true, false] as const),
        ...productionProjectProjectLayout.contentRoots.map((root: "viewer" | "scripts" | "public" | "assets"): readonly ["viewer" | "scripts" | "public" | "assets", false, true] => [root, false, true] as const),
    ]) {
        const absolute: string = resolveInside(state.root, relativeRoot);
        const linked: Stats | null = lstatOrNull(absolute);
        if (linked === null ||
            linked.isSymbolicLink() ||
            linked.isDirectory() === false)
            throw new Error(`Declared content root "${relativeRoot}" must be a physical project directory before compilation.`);
        const physicalRoot: string = fileSystem.realpathSync(absolute);
        if (isInside(state.rootReal, physicalRoot) === false)
            throw new Error(`Declared content root "${relativeRoot}" escapes the production project through a directory junction. Move it into a physical project directory before compilation.`);
        visit(absolute, physicalRoot, source, render);
    }
    for (const relativeFile of productionProjectProjectLayout.contentFiles) {
        const absolute: string = resolveInside(state.root, relativeFile);
        const linked: Stats | null = lstatOrNull(absolute);
        if (linked === null) {
            setInput(normalizeSlash(relativeFile), null, false, true);
            continue;
        }
        if (linked.isSymbolicLink() || linked.isFile() === false)
            throw new Error(`Declared content file "${relativeFile}" must be a physical regular file before compilation.`);
        const real: string = fileSystem.realpathSync(absolute);
        if (isInside(state.rootReal, real) === false)
            throw new Error(`Declared content file "${relativeFile}" escapes the production project through a directory junction. Move it into a physical project directory before compilation.`);
        setInput(normalizeSlash(relativeFile), readContent(state.rootReal, real), false, true);
    }
    if (state.manifest_.assetManifest !== undefined) {
        const relativeFile: "automovie/assets.json" = state.manifest_.assetManifest;
        const absolute: string = resolveInside(state.root, relativeFile);
        const linked: Stats | null = lstatOrNull(absolute);
        if (linked === null)
            setInput(normalizeSlash(relativeFile), null, false, false);
        else {
            if (linked.isSymbolicLink() || linked.isFile() === false)
                throw new Error(`Declared asset manifest "${relativeFile}" must be a physical regular file before compilation.`);
            const real: string = fileSystem.realpathSync(absolute);
            if (isInside(state.rootReal, real) === false)
                throw new Error(`Declared asset manifest "${relativeFile}" escapes the production project through a junction. Move it into the physical automovie directory before compilation.`);
            setInput(normalizeSlash(relativeFile), readContent(state.rootReal, real), false, false);
        }
    }
    return [...inputs]
        .map(([inputPath, input]: [string, { bytes: Uint8Array | null; render: boolean; source: boolean; }]): { bytes: Uint8Array | null; render: boolean; source: boolean; path: string; } => ({ path: inputPath, ...input }))
        .sort((left: { bytes: Uint8Array | null; render: boolean; source: boolean; path: string; }, right: { bytes: Uint8Array | null; render: boolean; source: boolean; path: string; }): number => compareCodeUnits(left.path, right.path));
}
