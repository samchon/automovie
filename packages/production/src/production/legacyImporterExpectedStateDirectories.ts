import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterProductionStateDirectories } from "./legacyImporterProductionStateDirectories";

/**
 * Expand the fixed import-state directory leaves into every ancestor directory expected in an untouched imported state, then return a sorted distinct path list.
 *
 * @evidence contracts/common.md#principled-implementation Each supported state leaf contributes its slash-prefix closure, matching mkdir recursive effects used by publication and restoration.
 * @evidence contracts/common.md#clear-and-simple-design Derives expected topology from one shared directory declaration rather than maintaining a second hand-copied ancestor inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actual tree is inferred from this list; verification compares it with the independently observed complete state topology.
 * @evidence contracts/common.md#meaningful-documentation Documents expected ancestor closure and that this declaration does not witness current filesystem existence.
 * @evidence contracts/performance.md#efficient-algorithms For L declared leaves and P total segments, builds/deduplicates prefixes then sorts C distinct ancestors, costing path-character work plus O(C log C) comparisons and O(C) path storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the state-directory declaration with publication/restoration; each call constructs a small fresh expected inventory rather than introducing a global mutable result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns ordinary path strings and creates no directory, lock or descriptor.
 */
export const legacyImporterExpectedStateDirectories: () => string[] = (): string[] => {
  const output: Set<string> = new Set<string>();
  for (const relative of legacyImporterProductionStateDirectories) {
    let current: string = "";
    for (const segment of relative.split("/")) {
      current = current.length === 0 ? segment : `${current}/${segment}`;
      output.add(current);
    }
  }
  return [...output].sort(compareCodeUnits);
};
