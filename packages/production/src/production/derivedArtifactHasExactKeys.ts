import { compareCodeUnits } from "./contentIdentity";

/**
 * Sorted own enumerable keys are compared positionally with an already code-unit-sorted expected key list.
 *
 * @evidence contracts/common.md#principled-implementation Sorted own enumerable keys are compared positionally with an already code-unit-sorted expected key list.
 * @evidence contracts/common.md#clear-and-simple-design Fixed manifest schemas provide the expected order, so one key admission owner covers root, record and dependency shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper does not sort expected itself; passing an unsorted expected list is outside its actual schema callers' premise.
 * @evidence contracts/common.md#meaningful-documentation States own-enumerable key scope and the expected-order premise.
 * @evidence contracts/performance.md#efficient-algorithms For K keys, sorting takes O(K log K) comparisons plus key-text cost and K temporary references.
 * @evidence contracts/performance.md#reuse-equivalent-work Each object's keys are read at admission; caching would require proving the mutable object's key set is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary keys expire after the boolean returns and the object is not retained.
 */
export const derivedArtifactHasExactKeys: (value: Record<string, unknown>, expected: readonly string[]) => boolean = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
    const keys: string[] = Object.keys(value).sort(compareCodeUnits);
    return (keys.length === expected.length &&
        keys.every((key: string, index: number) : boolean => key === expected[index]));
};
