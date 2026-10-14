import { compareCodeUnits } from "../contentIdentity";

/**
 * Refuse an evidence record whose own enumerable string keys differ from the protocol key set; typed object input is required and this function alone does not establish field schema or prototype safety.
 *
 * @evidence contracts/common.md#principled-implementation Sorts actual and expected key lists with code-unit ordering and compares lengths and corresponding strings exactly.
 * @evidence contracts/common.md#clear-and-simple-design One shared helper keeps evidence, coverage, sidecar and receipt envelope key admission consistent before their field-specific checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected keys are refused instead of projected away; expected keys are the actual protocol and no consumer-specific extras are waived.
 * @evidence contracts/common.md#meaningful-documentation Documents enumerable-own-string-key scope, typed-record premise and thrown mismatch; symbols/non-enumerables and values are outside this key-only predicate.
 * @evidence contracts/performance.md#efficient-algorithms For K actual and E expected keys, sorting costs O(K log K + E log E) comparator calls with string comparison cost, plus linear pair checks and formatted error text. Actual K and key lengths are uncapped even though supported expected sets are fixed and small.
 * @evidence contracts/performance.md#reuse-equivalent-work The two sorted arrays serve length, pair comparison and failure text within this call; no mutable expected/actual record is cached across invocations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Key arrays and diagnostic strings are invocation-local and no object field is retained or mutated; no handle/task is acquired and array allocation grows with actual own-key population.
 */
export const productionSemanticMaskExactKeys: (value: object, expected: readonly string[], name: string) => void = (value: object, expected: readonly string[], name: string): void => {
    const actual: string[] = Object.keys(value).sort(compareCodeUnits);
    const canonical: string[] = [...expected].sort(compareCodeUnits);
    if (actual.length !== canonical.length ||
        actual.some((key: string, index: number): boolean => key !== canonical[index]))
        throw new Error(`invalid semantic ${name} keys; expected ${canonical.join(", ")}`);
};
