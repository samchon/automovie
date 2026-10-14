import { productionBinderCompareCodeUnits } from "./productionBinderCompareCodeUnits";

/**
 * Order already matched numbered names, resolving equal numbers by code-unit spelling.
 *
 * @evidence contracts/common.md#principled-implementation The caller supplies a nonglobal pattern already matched against each candidate; its fixed numeric capture orders identifiers before code-unit text resolves equal numbers.
 * @evidence contracts/common.md#clear-and-simple-design Returns one comparator for accepted group/unit names instead of duplicating their numeric tie-break behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The matched-name and nonglobal-pattern premises are required; this helper does not validate arbitrary names or deduplicate equal numeric prefixes.
 * @evidence contracts/common.md#meaningful-documentation Documents ascending numeric/code-unit ordering, accepted-input premise and preserved distinct-slug ties.
 * @evidence contracts/performance.md#efficient-algorithms Each sort comparison executes the two pattern matches and numeric conversion, plus a length-dependent text tie-break when needed; the caller owns population sorting cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One comparator closure borrows the already shared pattern for a single list sort; no sorted results are cached across populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains only its pattern until the caller's sort releases it; no descriptor, task or name population is captured.
 */
export function productionBinderNumberedOrder(pattern: RegExp): (left: string, right: string) => number {
    return (left: string, right: string): number => Number(pattern.exec(left)![1]) - Number(pattern.exec(right)![1]) ||
        productionBinderCompareCodeUnits(left, right);
}
