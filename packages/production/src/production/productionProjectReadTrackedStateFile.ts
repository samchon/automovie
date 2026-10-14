import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { assertAutoMovieProductionProjectRegularFile as assertOwnedRegularFile } from "./assertAutoMovieProductionProjectRegularFile";
import path from "node:path";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";
import { productionProjectTrackedStatePath } from "./productionProjectTrackedStatePath";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Read one resident selected-production state file, returning null only for initial absence.
 *
 * @evidence contracts/common.md#principled-implementation The direct incarnation check and tracked-path operation's repeated check retain their order; a missing lstat returns null, while a present target passes physical root/regular-file admission and the owned descriptor/ancestry reader.
 * @evidence contracts/common.md#clear-and-simple-design State addressing and byte ownership remain distinct operations; claim, repaint selection and delivery readers interpret these bytes through their own exact schemas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe resident paths and read races are not reported as absence or replaced by empty bytes; no state-file name bypasses the physical read guard.
 * @evidence contracts/common.md#meaningful-documentation States null versus resident refusal and the repeated incarnation checks; the returned bytes are not independently schema-validated or a publication-currentness verdict.
 * @evidence contracts/performance.md#efficient-algorithms Work includes two incarnation admissions, root/path observations and the B-byte guarded read with directory-depth checks; the repeated admission is preserved rather than elided as a claimed speedup.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured generations are reused only as comparison bases; each invocation observes fresh resident bytes and no receipt/claim ID is treated as proof of byte equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned reader attempts primary and recheck descriptor cleanup on success/failure and propagates close failures without claiming host release; returned bytes transfer to the caller and this operation retains no file buffer, lock or task.
 */
export function productionProjectReadTrackedStateFile(state: AutoMovieProductionProjectState, relativePath: string): Uint8Array | null {
    productionProjectAssertIncarnation(state);
    const file: string = productionProjectTrackedStatePath(state, relativePath);
    if (lstatOrNull(file) === null)
        return null;
    const root: string = productionProjectOwnedRootReal(state.rootReal, state.productionStateRoot);
    assertOwnedRegularFile(root, file);
    return readAutoMovieProductionOwnedFile({
        root,
        directory: root,
        relative: path.relative(root, file),
    });
}
