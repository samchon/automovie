import { compareCodeUnits } from "./contentIdentity";
import { AutoMovieLegacyImportPlanError } from "./AutoMovieLegacyImportPlanError";

/**
 * Every caller-approved path must be strictly greater than its predecessor under code-unit comparison.
 *
 * @evidence contracts/common.md#principled-implementation Every caller-approved path must be strictly greater than its predecessor under code-unit comparison.
 * @evidence contracts/common.md#clear-and-simple-design Inventory and directory lists share ordering while callers choose their path semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function validates persisted order rather than silently sorting it or ignoring duplicates.
 * @evidence contracts/common.md#meaningful-documentation States original-list ownership and role-attributed typed refusal.
 * @evidence contracts/performance.md#efficient-algorithms Visits P paths with adjacent comparison text and caller predicate costs, retaining one predecessor.
 * @evidence contracts/performance.md#reuse-equivalent-work The comparator is shared, but each current sequence is checked afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input remains caller-owned and no handle is retained.
 */
export const legacyImportAssertSortedPaths: (paths: readonly string[], role: string, predicate: (path: string) => boolean) => void = (paths: readonly string[], role: string, predicate: (path: string) => boolean): void => {
    let previous: string | undefined;
    for (const path of paths) {
        if (!predicate(path) ||
            (previous !== undefined && compareCodeUnits(previous, path) >= 0))
            throw new AutoMovieLegacyImportPlanError(`${role} must contain canonical, strictly sorted paths`);
        previous = path;
    }
};
