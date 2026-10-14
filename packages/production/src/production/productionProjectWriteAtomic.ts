import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionProjectTemporaryPath } from "./productionProjectTemporaryPath";
import { IAutoMovieProductionProjectAtomicFailure } from "./IAutoMovieProductionProjectAtomicFailure";
import { productionProjectRenameContendedAtomic } from "./productionProjectRenameContendedAtomic";
import { productionProjectRemoveAtomicTemporary } from "./productionProjectRemoveAtomicTemporary";

/**
 * Write complete temporary bytes, guard, rename, then acknowledge publication.
 *
 * Parent creation and temporary writing precede the caller's beforePublish guard. Native rename publishes the target before afterPublish runs. Any later failure can therefore leave published bytes; the transaction owner records that boundary and decides rollback. Finally always requests temporary cleanup, which can aggregate the original and cleanup failures. This boundary provides no fsync durability guarantee.
 *
 * @evidence contracts/common.md#principled-implementation A PID/UUID sibling holds complete bytes before guarded native rename; post-publication notification precedes finally cleanup and preserves actual failure ordering.
 * @evidence contracts/common.md#clear-and-simple-design This byte writer owns one publication sequence while callbacks own namespace fencing and transaction accounting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No direct partial target write, silent cleanup success or automatic rollback replaces the original sequence; UUID naming is not an exclusive-open or durability certificate.
 * @evidence contracts/common.md#meaningful-documentation States callback ordering, surviving publication after failure, cleanup aggregation and absent durability guarantee.
 * @evidence contracts/performance.md#efficient-algorithms B supplied bytes require one native write, then rename and cleanup with their bounded contention attempts; parent mkdir and callback costs remain actual host work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Writing and notifying publication are effects for this transaction; equal bytes do not permit sharing a previous callback or write.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns content; the temporary is cleaned on success/failure, but cleanup refusal can retain it and published target lifetime belongs to the project owner.
 */
export function productionProjectWriteAtomic(file: string, content: Uint8Array, beforePublish: () => void = (): void => undefined, afterPublish: () => void = (): void => undefined): void {
    fileSystem.mkdirSync(path.dirname(file), { recursive: true });
    const temporary: string = productionProjectTemporaryPath(file, "tmp");
    let failure: IAutoMovieProductionProjectAtomicFailure | undefined;
    try {
        fileSystem.writeFileSync(temporary, content);
        beforePublish();
        productionProjectRenameContendedAtomic(temporary, file);
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
