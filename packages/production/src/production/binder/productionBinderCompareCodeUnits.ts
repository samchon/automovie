/**
 * Order binder path strings by locale-independent JavaScript code units.
 *
 * @evidence contracts/common.md#principled-implementation JavaScript relational string comparison supplies locale-independent code-unit ordering; subtracting boolean indicators returns negative, zero or positive direction.
 * @evidence contracts/common.md#clear-and-simple-design One comparator defines flat-path sorting and numbered-name text ties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No locale, fixture or filename-specific branch changes ordering.
 * @evidence contracts/common.md#meaningful-documentation Documents code-unit rather than language-aware ordering and equality returning zero.
 * @evidence contracts/performance.md#efficient-algorithms Comparison can scan the common string prefix, so cost depends on compared text lengths rather than being universally constant.
 * @evidence contracts/performance.md#reuse-equivalent-work All binder ordering consumers share one comparator identity and cache no comparison outcomes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Strings are borrowed and only a number escapes; no resource or retained population is owned.
 */
export function productionBinderCompareCodeUnits(left: string, right: string): number {
    return Number(left > right) - Number(left < right);
}
