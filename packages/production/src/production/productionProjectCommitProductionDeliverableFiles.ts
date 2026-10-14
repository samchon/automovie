import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";
import path from "node:path";
import { compareCodeUnits, encodeAutoMoviePathSegment } from "./contentIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Publish the supplied nonempty deliverable file set in canonical path order under the selected render namespace.
 *
 * @evidence contracts/common.md#principled-implementation Portable deliverable ID and root-contained path resolution precede case-folded duplicate refusal; sorted normalized entries are passed to the existing transaction and returned as deliverable-relative paths with its revision.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns supplied-set path projection and ordering; media/schema validation and aggregate delivery ledger publication remain separate caller responsibilities, while commitFiles owns staging and rollback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty sets, lexical escapes and portable collisions refuse; this operation neither deletes unspecified resident members nor treats arbitrary supplied bytes as a verified deliverable.
 * @evidence contracts/common.md#meaningful-documentation States canonical supplied-set publication, revision/path output and retained namespace guards; existing extra files are outside this update and callers must judge media/currentness independently.
 * @evidence contracts/performance.md#efficient-algorithms F entries are projected, case-checked and sorted in O(F log F) comparisons plus path text; transaction staging copies all new bytes and reads prior target bytes for rollback, so total work/storage includes actual supplied and replaced payloads.
 * @evidence contracts/performance.md#reuse-equivalent-work Normalized entries are reused for transaction paths and returned relative addresses; the portable Set handles collision checks without another population scan, and there is no cross-publication byte cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input byte arrays are borrowed and entry arrays reference them; commitFiles owns copied new/prior buffers and lock cleanup, while only revision/path strings escape without retaining deliverable media or an asynchronous task.
 */
export function productionProjectCommitProductionDeliverableFiles(state: AutoMovieProductionProjectState, deliverableId: string, files: ReadonlyMap<string, Uint8Array>): {
    /** Revision returned after the supplied set's guarded transaction. */
    revision: number;

    /** Sorted render-root-relative addresses of the supplied deliverable members. */
    paths: string[];
} {
    if (files.size === 0)
        throw new Error(`Deliverable "${deliverableId}" has no files to commit.`);
    const relativeRoot: string = `deliverables/${encodeAutoMoviePathSegment(deliverableId)}`;
    const renderRoot: string = productionProjectRenderRoot(state);
    const deliverableRoot: string = resolveInside(renderRoot, relativeRoot);
    const portablePaths: Set<string> = new Set<string>();
    const entries: { absolute: string; relativePath: string; content: Uint8Array<ArrayBufferLike>; }[] = [...files]
        .map(([relativePath, content]: [string, Uint8Array<ArrayBufferLike>]): { absolute: string; relativePath: string; content: Uint8Array<ArrayBufferLike>; } => {
        const absolute: string = resolveInside(deliverableRoot, relativePath);
        const normalized: string = normalizeSlash(path.relative(deliverableRoot, absolute));
        const portable: string = normalized.toLowerCase();
        if (portablePaths.has(portable))
            throw new Error(`Deliverable "${deliverableId}" maps more than one input to "${normalized}". Use unique canonical file paths.`);
        portablePaths.add(portable);
        return {
            absolute,
            relativePath: normalized,
            content,
        };
    })
        .sort((left: { absolute: string; relativePath: string; content: Uint8Array<ArrayBufferLike>; }, right: { absolute: string; relativePath: string; content: Uint8Array<ArrayBufferLike>; }): number => compareCodeUnits(left.relativePath, right.relativePath));
    const revision: number = productionProjectCommitFiles(state, entries.map((entry: { absolute: string; relativePath: string; content: Uint8Array<ArrayBufferLike>; }): { path: string; content: Uint8Array<ArrayBufferLike>; } => ({
        path: entry.absolute,
        content: entry.content,
    })));
    return {
        revision,
        paths: entries.map((entry: { absolute: string; relativePath: string; content: Uint8Array<ArrayBufferLike>; }): string => `${relativeRoot}/${entry.relativePath}`),
    };
}
