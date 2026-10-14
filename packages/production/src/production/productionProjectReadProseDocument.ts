import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { Stats } from "node:fs";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Read author-owned text for builder document/source consumers while keeping missing-document diagnostics nullable.
 *
 * Current-incarnation failures propagate. Lexical escape, an absent or non-file final entry, and an outside-root realpath return null; a present admitted file is read through physical descriptor/ancestry guards and decoded with Node's UTF-8 Buffer conversion. Later native/read failures propagate rather than becoming missing-document results.
 *
 * @evidence contracts/common.md#principled-implementation Incarnation admission precedes lexical resolution, lstat and realpath containment; admitted resident bytes use the existing owned-file reader, preserving its physical generation checks before text conversion.
 * @evidence contracts/common.md#clear-and-simple-design This shared nullable text boundary serves source snapshot and screenplay readers without assigning builder ownership to author files or duplicating descriptor admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the existing nullable path/entry conditions yield null; current-generation and guarded-read failures are not swallowed, and Buffer UTF-8 decoding does not claim strict malformed-byte refusal.
 * @evidence contracts/common.md#meaningful-documentation Gives author ownership, exact null/error distinctions, physical read boundary and UTF-8 decoding behavior; text return does not certify screenplay or source semantics.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes incarnation records/ancestries, native target checks and the B-byte read/copy/UTF-8 conversion; both returned text and temporary bytes scale with B.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call reads current author bytes and physical facts; an earlier document path or text result does not prove an unchanged builder input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned reader attempts primary/recheck descriptor cleanup and reports close failure rather than guaranteeing host release. Full read bytes, the Buffer copy and decoded text can coexist without a byte cap; only text transfers on success, with no retained document store or task.
 */
export function productionProjectReadProseDocument(state: AutoMovieProductionProjectState, relativePath: string): string | null {
    productionProjectAssertIncarnation(state);
    let file: string;
    try {
        file = resolveInside(state.root, relativePath);
    }
    catch {
        return null;
    }
    const linked: Stats | null = lstatOrNull(file);
    if (linked === null || linked.isFile() === false)
        return null;
    if (isInside(state.rootReal, fileSystem.realpathSync(file)) === false)
        return null;
    return Buffer.from(readAutoMovieProductionOwnedFile({
        root: state.rootReal,
        directory: path.dirname(file),
        relative: path.basename(file),
    })).toString("utf8");
}
