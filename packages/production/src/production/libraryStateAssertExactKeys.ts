import { compareCodeUnits } from "./contentIdentity";

/**
 * Both callers have already read one required member off `value`, so the actual key list is never empty when it is reported.
 *
 * @evidence contracts/common.md#principled-implementation Own enumerable and expected keys are independently sorted and compared as JSON arrays.
 * @evidence contracts/common.md#clear-and-simple-design Index and owner schema checks share this exact member-set gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototype/symbol properties are outside persistent JSON's string-key comparison; callers already read a required key before reporting actual keys.
 * @evidence contracts/common.md#meaningful-documentation States missing/extra refusal and own-enumerable scope.
 * @evidence contracts/performance.md#efficient-algorithms Sorts K actual/E expected keys and serializes comparison lists with proportional storage/text.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the shared comparator rather than caching mutable-object key admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary keys/text expire after return or throw; the input record is not retained.
 */
export const libraryStateAssertExactKeys: (value: Record<string, unknown>, expected: readonly string[]) => void = (value: Record<string, unknown>, expected: readonly string[]): void => {
    const actual: string[] = Object.keys(value).sort(compareCodeUnits);
    if (JSON.stringify(actual) !==
        JSON.stringify([...expected].sort(compareCodeUnits)))
        throw new Error(`Library index object has unexpected or missing members: ${actual.join(", ")}.`);
};
