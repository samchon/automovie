import type { IAutoMovieLegacyImportInventoryEntry } from "@automovie/interface";
import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";
import { AutoMovieLegacyImportPlanError } from "./AutoMovieLegacyImportPlanError";
import { legacyImportAssertSortedPaths } from "./legacyImportAssertSortedPaths";
import { legacyImportIsBaselinePath } from "./legacyImportIsBaselinePath";
import { legacyImportAssertInventory } from "./legacyImportAssertInventory";

/**
 * Root order and absent-root emptiness precede contained sorted directory/file admission and cross-kind case collision rejection.
 *
 * @evidence contracts/common.md#principled-implementation Root order and absent-root emptiness precede contained sorted directory/file admission and cross-kind case collision rejection.
 * @evidence contracts/common.md#clear-and-simple-design All three rollback baselines use this owner without restoring files here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lexical descendants are checked under the historical legacy path rule, which does not independently reject every portable device or colon hazard.
 * @evidence contracts/common.md#meaningful-documentation States first typed refusal, baseline ordering and no filesystem observation.
 * @evidence contracts/performance.md#efficient-algorithms Scans D directories/F files with path checks and a case-folded occupied set of O(D+F) keys.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses inventory and sorted-path admission; mutable baseline results are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local paths/sets expire and no file or handle is acquired.
 */
export const legacyImportAssertBaseline: (baseline: IAutoMovieLegacyOwnedDirectoryBaseline, expectedPath: IAutoMovieLegacyOwnedDirectoryBaseline["path"]) => void = (baseline: IAutoMovieLegacyOwnedDirectoryBaseline, expectedPath: IAutoMovieLegacyOwnedDirectoryBaseline["path"]): void => {
    if (baseline.path !== expectedPath)
        throw new AutoMovieLegacyImportPlanError(`rollbackBaseline entry ${expectedPath} is out of canonical order`);
    if (!baseline.existed &&
        (baseline.directories.length !== 0 || baseline.files.length !== 0))
        throw new AutoMovieLegacyImportPlanError(`absent rollback baseline ${expectedPath} must be empty`);
    legacyImportAssertSortedPaths(baseline.directories, `${expectedPath} directories`, (path: string) : boolean => legacyImportIsBaselinePath(path, expectedPath));
    legacyImportAssertInventory(baseline.files, `${expectedPath} files`, (entry: IAutoMovieLegacyImportInventoryEntry) : boolean => entry.kind === "project" && legacyImportIsBaselinePath(entry.path, expectedPath));
    const occupied: Set<string> = new Set<string>();
    for (const path of [
        ...baseline.directories,
        ...baseline.files.map((entry: IAutoMovieLegacyImportInventoryEntry) : string => entry.path),
    ]) {
        const lower: string = path.toLowerCase();
        if (occupied.has(lower))
            throw new AutoMovieLegacyImportPlanError(`${expectedPath} baseline paths collide by case or file kind`);
        occupied.add(lower);
    }
};
