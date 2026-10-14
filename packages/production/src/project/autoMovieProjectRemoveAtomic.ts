import { randomUUID } from "node:crypto";
import { productionFileSystem as fileSystem } from "./productionFileSystem";

/**
 * Rename one selected leaf into quarantine before removal under namespace assertions. ENOENT returns without a leaf removal; a later failure attempts restoration only when quarantine still exists and the original destination is absent. Unsafe or failed restoration can retain quarantine, and the original failure propagates.
 *
 * @evidence contracts/common.md#principled-implementation A fenced rename quarantines the leaf before unlink; failure attempts safe restoration if the original destination is absent.
 * @evidence contracts/common.md#clear-and-simple-design One selected-file removal keeps stale namespace cleanup behind current assertions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts ENOENT is a no-file result; failed restoration/namespace checks can retain quarantine and the original failure propagates.
 * @evidence contracts/common.md#meaningful-documentation States quarantine, absence handling and conditional rollback limits.
 * @evidence contracts/performance.md#efficient-algorithms Metadata/fence operations dominate without reading file bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Current existence witnesses control restoration; earlier missing checks are not reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful removal frees the quarantine; failed safe cleanup can retain it without a lifetime cap.
 */
export const autoMovieProjectRemoveAtomic: (file: string, assertNamespace: () => void) => void = (file: string, assertNamespace: () => void): void => {
    const quarantine: string = `${file}.delete.${process.pid}.${randomUUID()}`;
    assertNamespace();
    try {
        fileSystem.renameSync(file, quarantine);
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            assertNamespace();
            return;
        }
        throw error;
    }
    try {
        assertNamespace();
        fileSystem.rmSync(quarantine, { force: true });
        assertNamespace();
    }
    catch (error) {
        try {
            assertNamespace();
            if (fileSystem.existsSync(quarantine) &&
                fileSystem.existsSync(file) === false)
                fileSystem.renameSync(quarantine, file);
            assertNamespace();
        }
        catch {
        }
        throw error;
    }
};
