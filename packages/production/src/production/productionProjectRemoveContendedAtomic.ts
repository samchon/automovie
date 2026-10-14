import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionProjectRunContendedAtomic } from "./productionProjectRunContendedAtomic";

/**
 * Remove one owned file path with native force-absence semantics.
 *
 * @evidence contracts/common.md#principled-implementation Scoped rmSync with force true removes the supplied path and delegates configured contention failures to the shared retry owner.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns one removal effect and path description, not retry timing or transaction recovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No recursive deletion or fallback permission change expands the target; callers establish path ownership before invoking it.
 * @evidence contracts/common.md#meaningful-documentation States owned-file scope, force-absence behavior and separate caller recovery responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Native single-entry removal and at most five configured attempts dominate; the adapter scans no payload or directory tree.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A removal request is an effect, so a previous absent observation cannot replace its current execution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No descriptor, timer or path cache remains after the synchronous removal completes or refuses.
 */
export function productionProjectRemoveContendedAtomic(file: string): void {
    return productionProjectRunContendedAtomic((): void => fileSystem.rmSync(file, { force: true }), (): string => `Production atomic removal of "${file}" failed`);
}
