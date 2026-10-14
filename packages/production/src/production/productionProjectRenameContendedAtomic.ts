import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionProjectRunContendedAtomic } from "./productionProjectRunContendedAtomic";

/**
 * Rename the actual source path to its publication or recovery target.
 *
 * @evidence contracts/common.md#principled-implementation The scoped filesystem's renameSync supplies the native effect; the shared contention owner preserves immediate success and bounded retry refusal.
 * @evidence contracts/common.md#clear-and-simple-design Path-specific description stays in this adapter while retry codes and waits remain shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No copy/delete fallback changes native rename semantics; namespace admission and retry-safe use remain with publication/recovery callers.
 * @evidence contracts/common.md#meaningful-documentation Identifies source/target meaning, native rename ownership and caller admission obligations.
 * @evidence contracts/performance.md#efficient-algorithms Native rename cost and configured retries/waits dominate; this adapter reads no payload bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rename is effectful and each requested publication/recovery invokes it independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains no path or descriptor after return/refusal; native filesystem resources belong to the host operation.
 */
export function productionProjectRenameContendedAtomic(from: string, to: string): void {
    return productionProjectRunContendedAtomic((): void => fileSystem.renameSync(from, to), (): string => `Production atomic publish of "${to}" failed`);
}
