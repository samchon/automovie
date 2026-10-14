import { assertAutoMovieProductionProjectRegularFile as assertOwnedRegularFile } from "./assertAutoMovieProductionProjectRegularFile";
import path from "node:path";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectWriteJsonAtomic } from "./productionProjectWriteJsonAtomic";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectAssertWritable } from "./productionProjectAssertWritable";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Publish JSON atomically under writable, physical-ancestor and root fences.
 *
 * @evidence contracts/common.md#principled-implementation Checks writable/root, resident parent ancestry and target regular-file admission before atomic JSON publication, then repeats ancestry/target/root checks in their original order.
 * @evidence contracts/common.md#clear-and-simple-design Owns project fencing while writeJsonAtomic owns serialization, temporary publication and bounded contention retry; no second transaction protocol is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused target is never overwritten, but failure after publication does not imply rollback of already published JSON; this is not a multi-file commit by itself.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes atomic single-file publication from surrounding physical-fence checks and their possible post-write refusal effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes two ancestor traversals, target/root checks and JSON serialization/write proportional to value bytes, plus the existing bounded retry policy on contended atomic steps.
 * @evidence contracts/performance.md#reuse-equivalent-work Every call serializes its requested value and rechecks the resident namespace; equivalent bytes do not authorize sharing a write or skipping its physical checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary-file and cleanup ownership remains in the atomic helper; this coordinator retains no handle or task and successfully published bytes remain repository-owned.
 */
export function productionProjectWriteOwnedJsonAtomic(state: AutoMovieProductionProjectState, file: string, value: unknown): void {
    productionProjectAssertWritable(state);
    productionProjectAssertProjectRootIdentity(state);
    productionProjectAssertPhysicalDirectoryAncestors(state.rootReal, path.dirname(file), false);
    assertOwnedRegularFile(state.rootReal, file);
    productionProjectWriteJsonAtomic(file, value);
    productionProjectAssertPhysicalDirectoryAncestors(state.rootReal, path.dirname(file), false);
    assertOwnedRegularFile(state.rootReal, file);
    productionProjectAssertProjectRootIdentity(state);
}
