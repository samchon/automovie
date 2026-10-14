import { requiredArray } from "./requiredArray";
import { integerIndex } from "./integerIndex";

/**
 * Validate every index in an optional glTF reference array.
 *
 * @evidence contracts/common.md#principled-implementation Undefined allows omitted references; a supplied array delegates each element's safe in-range admission with an indexed path.
 * @evidence contracts/common.md#clear-and-simple-design Array shape belongs to requiredArray and each index predicate to integerIndex, leaving this owner only enumeration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed references are neither skipped nor coerced, so the first failing index remains observable.
 * @evidence contracts/common.md#meaningful-documentation Comments describe optional-array meaning, indexed failures and the predeclared inventory length.
 * @evidence contracts/performance.md#efficient-algorithms An N-reference array costs O(N) with no new result array and constant work per index.
 * @evidence contracts/performance.md#reuse-equivalent-work Each reference is checked once using the shared single-index admission rule.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The enumeration borrows its array for the call and retains no graph or payload resource.
 * @author Samchon
 */
export const integerIndices: (value: unknown, length: number, path: string) => void = (value: unknown, length: number, path: string): void => {
  if (value === undefined) return;
  requiredArray(value, path).forEach((entry: unknown, index: number): void =>
    integerIndex(entry, length, `${path}[${index}]`, true),
  );
};
