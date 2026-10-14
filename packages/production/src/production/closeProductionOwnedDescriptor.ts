import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { IProductionOwnedDescriptorFailure } from "./IProductionOwnedDescriptorFailure";
import { ProductionOwnedDescriptorCleanupError } from "./ProductionOwnedDescriptorCleanupError";

/**
 * Attempt one descriptor close while preserving an earlier read or cleanup failure.
 *
 * @evidence contracts/common.md#principled-implementation Successful close returns; close failure propagates unchanged when alone or joins earlier causes in the named cleanup AggregateError, flattening only that same cleanup class's existing errors.
 * @evidence contracts/common.md#clear-and-simple-design Primary and recheck descriptors share one close/error owner; byte reading and identity checks remain in the owned reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Earlier arbitrary thrown values remain cause references, and a failed native close is not rewritten as a successful release.
 * @evidence contracts/common.md#meaningful-documentation Defines close-only versus combined failure, recursive same-class flattening and target context.
 * @evidence contracts/performance.md#efficient-algorithms One native close plus copying K prior causes on combined failure and Error stack construction; no payload is copied.
 * @evidence contracts/performance.md#reuse-equivalent-work The same already captured failure is reused without repeating the read or close operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the descriptor and receives any release failure; this helper stores no handle, but returned Error causes live until the catcher releases them.
 */
export function closeProductionOwnedDescriptor(descriptor: number, failure: IProductionOwnedDescriptorFailure | undefined, target: string): void {
    try {
        fileSystem.closeSync(descriptor);
    }
    catch (closeFailure) {
        if (failure === undefined)
            throw closeFailure;
        throw new ProductionOwnedDescriptorCleanupError([
            ...(failure.error instanceof ProductionOwnedDescriptorCleanupError
                ? failure.error.errors
                : [failure.error]),
            closeFailure,
        ], `Production-owned descriptor cleanup failed after the read failed: ${target}.`);
    }
}
