import { compareCodeUnits } from "./contentIdentity";

/**
 * Return a code-unit ordered map with one key inserted or replaced.
 *
 * @evidence contracts/common.md#principled-implementation Map copying preserves source entries, set applies the exact key, and code-unit comparison gives deterministic iteration independent of locale.
 * @evidence contracts/common.md#clear-and-simple-design A local mutable copy feeds one sorted result without mutating the borrowed source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ID-specific order or deep-copy claim replaces ordinary map semantics.
 * @evidence contracts/common.md#meaningful-documentation Values retain their original object identities; readonly typing does not freeze the returned Map.
 * @evidence contracts/performance.md#efficient-algorithms N entries are copied, materialized and sorted with O(N log N) comparisons plus compared text; temporary and returned storage are O(N).
 * @evidence contracts/performance.md#reuse-equivalent-work Existing values are reused by reference; there is no cache across mutable source maps.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two maps and an entry array belong to this call; only the final map transfers to the caller.
 */
export function productionProjectReplaced<T>(source: ReadonlyMap<string, T>, id: string, value: T): ReadonlyMap<string, T> {
    const output: Map<string, T> = new Map(source);
    output.set(id, value);
    return new Map([...output].sort(([left]: [string, T], [right]: [string, T]): number => compareCodeUnits(left, right)));
}
