import type { IAutoMovieProductionProjectDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";
import type { BigIntStats, Stats } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { IRenderFileDescriptorFailure } from "./IRenderFileDescriptorFailure";
import { closeRenderFileDescriptor } from "./closeRenderFileDescriptor";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAcquirePhysicalDirectoryAncestry } from "./productionProjectAcquirePhysicalDirectoryAncestry";
import { productionProjectAssertPhysicalDirectoryAncestry } from "./productionProjectAssertPhysicalDirectoryAncestry";
import { productionProjectFileIdentityKey } from "./productionProjectFileIdentityKey";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";

/**
 * Read a regular render file between captured directory and reopened resident-file identity fences.
 *
 * @evidence contracts/common.md#principled-implementation Root/lexical admission and root-inclusive physical ancestry capture precede final regular-file/open checks; the primary descriptor's bigint device/inode is compared with reopened resident descriptors before and after reading, while each recheck also reobserves captured directories.
 * @evidence contracts/common.md#clear-and-simple-design This reader owns render descriptor acquisition and byte transfer; ancestry/identity helpers own their representations and closeRenderFileDescriptor owns cause-preserving cleanup, with media validation left to callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Same path spelling never replaces physical identity and no read is retried over a changed generation; the initial open catch assumes a native errno object, so an arbitrary null/undefined thrown value can produce a property-access error instead of preserving that value.
 * @evidence contracts/common.md#meaningful-documentation Defines missing/nonregular and physical-race refusal, two resident rechecks and caller-owned bytes; sequential fences do not prevent all intervening edits or prove content identity, and close failures remain observable cleanup limitations.
 * @evidence contracts/performance.md#efficient-algorithms Includes complete render-root admission, D-component ancestry capture plus up to two D-component rechecks, one B-byte descriptor read and up to two resident reopen/stat comparisons; bytes are returned without hashing or media parsing.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured ancestry and opened file identity serve both boundary rechecks, while resident descriptors and directory facts are reacquired each time instead of sharing a stale successful observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most the primary and one recheck descriptor are owned simultaneously; each acquired recheck reaches finally cleanup and the primary reaches cleanup after captured success/failure. Sole close failure propagates and combined failures aggregate in order, so attempted close is not claimed to prove host release; returned B-byte data transfers without retained tasks.
 */
export function productionProjectReadRenderFile(state: AutoMovieProductionProjectState, relativePath: string): Uint8Array {
    const root: string = productionProjectRenderRoot(state);
    const file: string = resolveInside(root, relativePath);
    const ancestry: IAutoMovieProductionProjectDirectoryAncestry = productionProjectAcquirePhysicalDirectoryAncestry(root, path.dirname(file));
    const linked: Stats | null = lstatOrNull(file);
    if (linked === null)
        throw new Error(`Render file "${relativePath}" does not exist.`);
    if (linked.isSymbolicLink() || linked.isFile() === false)
        throw new Error(`Render file "${relativePath}" is not a regular file. Replace the link or directory with renderer-owned bytes.`);
    let descriptor: number;
    try {
        descriptor = fileSystem.openSync(file, "r");
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
            throw new Error(`Render file "${relativePath}" does not exist.`);
        throw error;
    }
    let failure: IRenderFileDescriptorFailure | undefined;
    let bytes: Uint8Array | undefined;
    try {
        const opened: BigIntStats = fileSystem.fstatSync(descriptor, { bigint: true });
        const assertResidentFile: () => void = (): void => {
            productionProjectAssertPhysicalDirectoryAncestry(ancestry);
            const currentLink: Stats = fileSystem.lstatSync(file);
            if (currentLink.isSymbolicLink() || currentLink.isFile() === false)
                throw new Error(`Render file "${relativePath}" changed into a link or non-file while it was read.`);
            const real: string = fileSystem.realpathSync(file);
            const residentDescriptor: number = fileSystem.openSync(real, "r");
            let residentFailure: IRenderFileDescriptorFailure | undefined;
            try {
                const resident: BigIntStats = fileSystem.fstatSync(residentDescriptor, {
                    bigint: true,
                });
                if (productionProjectFileIdentityKey(resident) !== productionProjectFileIdentityKey(opened))
                    throw new Error(`Render file "${relativePath}" changed physical identity inside the render root. Re-render it inside the owned output root.`);
            }
            catch (error) {
                residentFailure = { error };
                throw error;
            }
            finally {
                closeRenderFileDescriptor(residentDescriptor, residentFailure, relativePath);
            }
        };
        assertResidentFile();
        bytes = fileSystem.readFileSync(descriptor);
        assertResidentFile();
    }
    catch (error) {
        failure = { error };
    }
    closeRenderFileDescriptor(descriptor, failure, relativePath);
    if (failure !== undefined)
        throw failure.error;
    return bytes!;
}
