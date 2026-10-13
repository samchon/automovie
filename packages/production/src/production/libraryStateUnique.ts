import { compareCodeUnits } from "./contentIdentity";

/**
 * Set cardinality rejects exact duplicate ids and code-unit sorting rejects noncanonical input order.
 *
 * @evidence contracts/common.md#principled-implementation Set cardinality rejects exact duplicate ids and code-unit sorting rejects noncanonical input order.
 * @evidence contracts/common.md#clear-and-simple-design Environment/model/context list admission shares this owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is validated rather than repaired; case-distinct ids remain distinct under the id contract.
 * @evidence contracts/common.md#meaningful-documentation States original-array return and role/owner-attributed failure.
 * @evidence contracts/performance.md#efficient-algorithms N ids require a set scan and O(N log N) comparisons with N temporary references/keys.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted original list is reused; mutation-blind verdicts are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the original array while temporary set/sorted copy expires.
 */
export const libraryStateUnique: (values: string[], owner: number, kind: string) => string[] = (values: string[], owner: number, kind: string): string[] => {
    if (new Set(values).size !== values.length)
        throw new Error(`Library index owner ${owner} repeats a ${kind} id.`);
    const sorted: string[] = [...values].sort(compareCodeUnits);
    if (JSON.stringify(values) !== JSON.stringify(sorted))
        throw new Error(`Library index owner ${owner} ${kind} ids are not in canonical order.`);
    return values;
};
