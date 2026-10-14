import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Resolve a not-yet-created output through its nearest existing physical ancestor.
 *
 * @evidence contracts/common.md#principled-implementation Walks upward only after native ENOENT, preserving missing path components and appending them to the first realpath result. The existing implementation assumes an ancestor eventually resolves and has no terminal-root check if that premise fails.
 * @evidence contracts/common.md#clear-and-simple-design Separates not-yet-created output resolution from actual directory creation and final separation checking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Permission and other native failures propagate instead of being treated as missing; no fabricated physical ancestor is selected when realpath fails.
 * @evidence contracts/common.md#meaningful-documentation Returns a prospective physical path without creating it or certifying future namespace identity, and explicitly states the resolving-ancestor premise and termination gap.
 * @evidence contracts/performance.md#efficient-algorithms At depth D performs up to D native realpath calls and unshifts suffix components, with O(D squared) array shifting plus path-text work; an unresolved root can repeat without a fixed attempt bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Preserves one suffix array through this call; no previous path/realpath success is reused across mutable filesystem observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Suffix strings remain call-local without a depth cap, and no handle is acquired; a nonterminating missing-root case can retain and grow this local state.
 */
export async function productionBinderProspectiveRealpath(target: string): Promise<string> {
    const suffix: string[] = [];
    let existing: string = target;
    while (true) {
        try {
            return path.join(await fs.realpath(existing), ...suffix);
        }
        catch (error) {
            if (!(error instanceof Error &&
                "code" in error &&
                String(error.code) === "ENOENT"))
                throw error;
            suffix.unshift(path.basename(existing));
            existing = path.dirname(existing);
        }
    }
}
