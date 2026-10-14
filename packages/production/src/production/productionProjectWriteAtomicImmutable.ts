import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { productionProjectTemporaryPath } from "./productionProjectTemporaryPath";
import { IAutoMovieProductionProjectAtomicFailure } from "./IAutoMovieProductionProjectAtomicFailure";
import { productionProjectRemoveAtomicTemporary } from "./productionProjectRemoveAtomicTemporary";

/**
 * Publish complete bytes by hard link at an unoccupied immutable target.
 *
 * A temporary sibling is written before the caller guard. linkSync publishes without replacing an existing target; EEXIST becomes the existing input-race error, and other native failures propagate. afterPublish runs after successful linking, so a later callback or cleanup failure does not erase the new target. Cleanup always attempts the temporary; the transaction owner accounts for publication and recovery. Supported host hard-link semantics, not fsync durability, supply this boundary.
 *
 * @evidence contracts/common.md#principled-implementation Native hard-link creation admits only an absent target, maps EEXIST to the input-race cause and preserves guarded publication-before-notification ordering.
 * @evidence contracts/common.md#clear-and-simple-design Immutable target admission stays distinct from replace-by-rename publication while both share temporary naming and causal cleanup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No overwrite or rename fallback defeats immutability; UUID sibling naming does not establish exclusive temporary acquisition or durable storage.
 * @evidence contracts/common.md#meaningful-documentation Explains host hard-link premise, EEXIST mapping, callback effects and publication surviving later failure.
 * @evidence contracts/performance.md#efficient-algorithms One B-byte native write, parent mkdir, guarded link and temporary removal dominate; link itself is attempted once rather than inheriting rename retries.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Immutable publication and its callbacks are transaction effects and cannot be replaced by a previous equal byte result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally removes the temporary link unless cleanup refuses; the published link remains project-owned and the caller retains content ownership.
 */
export function productionProjectWriteAtomicImmutable(file: string, content: Uint8Array, beforePublish: () => void, afterPublish: () => void): void {
    fileSystem.mkdirSync(path.dirname(file), { recursive: true });
    const temporary: string = productionProjectTemporaryPath(file, "tmp");
    let failure: IAutoMovieProductionProjectAtomicFailure | undefined;
    try {
        fileSystem.writeFileSync(temporary, content);
        beforePublish();
        try {
            fileSystem.linkSync(temporary, file);
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === "EEXIST")
                throw new AutoMovieProductionInputRaceError(`Immutable publication target "${file}" already exists. Reopen its exact bytes instead of replacing it.`);
            throw error;
        }
        afterPublish();
    }
    catch (error) {
        failure = { error };
        throw error;
    }
    finally {
        productionProjectRemoveAtomicTemporary(temporary, failure);
    }
}
