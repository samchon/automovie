import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import { IAutoMovieLegacyImportInventoryEntry } from "@automovie/interface";
import { legacyImportAssertSortedPaths } from "./legacyImportAssertSortedPaths";
import { legacyImportIsCanonicalRelativePath } from "./legacyImportIsCanonicalRelativePath";
import { AutoMovieLegacyImportPlanError } from "./AutoMovieLegacyImportPlanError";

/**
 * Sorted canonical paths, safe byte counts, digest format, permitted absent assets, caller predicates and case uniqueness admit metadata.
 *
 * @evidence contracts/common.md#principled-implementation Sorted canonical paths, safe byte counts, digest format, permitted absent assets, caller predicates and case uniqueness admit metadata.
 * @evidence contracts/common.md#clear-and-simple-design Top-level inventory and baseline files share admission with explicit additional predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null digest is allowed only for zero-byte absent assets; recorded digests are not recomputed from files.
 * @evidence contracts/common.md#meaningful-documentation States metadata-only admission and caller predicate participation.
 * @evidence contracts/performance.md#efficient-algorithms Scans N entries/path text, builds N path/folded references and invokes each extra predicate.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares ordering/digest rules without caching mutable records or omitting the extra predicate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary lists/keys expire after the void/throw outcome; no file is read.
 */
export const legacyImportAssertInventory: (inventory: readonly IAutoMovieLegacyImportInventoryEntry[], role: string, extra?: (entry: IAutoMovieLegacyImportInventoryEntry) => boolean) => void = (inventory: readonly IAutoMovieLegacyImportInventoryEntry[], role: string, extra: (entry: IAutoMovieLegacyImportInventoryEntry) => boolean = () : boolean => true): void => {
    legacyImportAssertSortedPaths(inventory.map((entry: IAutoMovieLegacyImportInventoryEntry) : string => entry.path), role, (path: string) : boolean => legacyImportIsCanonicalRelativePath(path));
    const folded: Set<string> = new Set<string>();
    for (const entry of inventory) {
        const lower: string = entry.path.toLowerCase();
        if (!Number.isSafeInteger(entry.bytes) ||
            entry.bytes < 0 ||
            (entry.digest === null && entry.bytes !== 0) ||
            (entry.digest === null && entry.kind !== "asset") ||
            (entry.digest !== null && !SHA256_DIGEST_PATTERN.test(entry.digest)) ||
            !extra(entry) ||
            folded.has(lower))
            throw new AutoMovieLegacyImportPlanError(`${role} contains an invalid entry for ${JSON.stringify(entry.path)}`);
        folded.add(lower);
    }
};
