import { assertAutoMovieProductionProjectRegularFile as assertOwnedRegularFile } from "./assertAutoMovieProductionProjectRegularFile";
import path from "node:path";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Read the project-wide incarnation's exact resident bytes for publication input identity.
 *
 * @evidence contracts/common.md#principled-implementation Current project/state/production incarnation and captured namespace checks precede physical AutoMovie-root admission; the constructor's incarnation.json location is a direct child of that root and passes regular-file and owned descriptor/ancestry admission.
 * @evidence contracts/common.md#clear-and-simple-design This projection exposes the one project-wide record publication fingerprinting needs, while logical generation checks and byte hashing remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No parsed/reserialized incarnation replaces exact resident bytes; the basename read relies on the constructor's direct-child path and does not accept arbitrary nested record addresses.
 * @evidence contracts/common.md#meaningful-documentation Defines the single incarnation byte field, its project-wide ownership and propagated resident/generation refusal; it is one current observation rather than an atomic snapshot of every publication input.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete incarnation admission and root/regular-file observations plus the B-byte guarded record read with ancestry fences; publication consumers separately hash the transferred bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor identities and paths supply guard operands, while exact resident bytes are freshly acquired for each fingerprint request instead of reusing a parsed incarnation or previous digest.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned reader attempts descriptor cleanup on success/failure and surfaces cleanup refusal; one full byte buffer transfers to the publication caller and this projection retains no record cache or task.
 */
export function productionProjectProjectStateRecords(state: AutoMovieProductionProjectState): {
    incarnation: Uint8Array;
} {
    productionProjectAssertIncarnation(state);
    const root: string = productionProjectOwnedRootReal(state.rootReal, state.automovieRoot);
    const read: (file: string) => Uint8Array = (file: string): Uint8Array => {
        assertOwnedRegularFile(root, file);
        return readAutoMovieProductionOwnedFile({
            root,
            directory: root,
            relative: path.basename(file),
        });
    };
    return {
        incarnation: read(state.incarnationPath),
    };
}
