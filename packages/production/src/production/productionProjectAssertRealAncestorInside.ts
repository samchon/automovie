import { isAutoMovieProductionProjectPathInside as isInside } from "./isAutoMovieProductionProjectPathInside";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";

/**
 * Resolve the nearest existing ancestor and refuse a physical escape from the owner root.
 *
 * @evidence contracts/common.md#principled-implementation Walks upward until an existing entry can be realpath-resolved, then compares its physical location with the admitted owner root; consuming commit/owned-root operations first admit that physical root and candidate routing.
 * @evidence contracts/common.md#clear-and-simple-design Checks the existing portion of a path before later atomic helpers create missing descendants, keeping physical routing separate from recursive creation and mutation locking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The upward search assumes a reachable filesystem root and has no explicit terminal guard if existsSync keeps reporting false there; physical containment is an observation, not a guarantee against later replacement.
 * @evidence contracts/common.md#meaningful-documentation Returns the nearest existing ancestor's real path or an attributed escape refusal, with consuming root admission and the unresolved unreachable-volume termination premise stated explicitly.
 * @evidence contracts/performance.md#efficient-algorithms Performs one exists check per missing ancestor and one realpath/containment comparison, with missing path depth and path-string lengths driving work; it does not enumerate descendants or media files.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the already admitted owner-root realpath as the comparison basis while observing this candidate's current ancestor anew; no prior existence result skips the walk.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only local path strings and transfers the resolved ancestor to the caller; synchronous metadata calls acquire no retained descriptor or task.
 */
export function productionProjectAssertRealAncestorInside(rootReal: string, candidate: string): string {
    let existing: string = candidate;
    while (fileSystem.existsSync(existing) === false)
        existing = path.dirname(existing);
    const real: string = fileSystem.realpathSync(existing);
    if (isInside(rootReal, real) === false)
        throw new Error(`Owned path "${candidate}" escapes the production root through "${existing}". Replace the symlink or junction with a project-local directory.`);
    return real;
}
