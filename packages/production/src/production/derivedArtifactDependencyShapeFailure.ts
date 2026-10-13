import { derivedArtifactIsPlainRecord } from "./derivedArtifactIsPlainRecord";
import { derivedArtifactHasExactKeys } from "./derivedArtifactHasExactKeys";

/**
 * A non-array object must contain exactly path and digest, both strings, before semantic dependency admission.
 *
 * @evidence contracts/common.md#principled-implementation A non-array object must contain exactly path and digest, both strings, before semantic dependency admission.
 * @evidence contracts/common.md#clear-and-simple-design Generator and input entries use the same structural check within manifest parsing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts String type is not a canonical path or SHA-256 format certificate; semantic checks remain required.
 * @evidence contracts/common.md#meaningful-documentation States the shape-only null/reason contract and exact two-key requirement.
 * @evidence contracts/performance.md#efficient-algorithms Examines two members and sorts the supplied object's K own keys to reject unexpected fields.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the exact-key owner with other manifest records; no shape verdict is cached over mutable objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a nullable string survives; temporary keys become unreachable on completion.
 */
export const derivedArtifactDependencyShapeFailure: (value: unknown) => string | null = (value: unknown): string | null => {
    if (derivedArtifactIsPlainRecord(value) === false)
        return "must be an object";
    if (derivedArtifactHasExactKeys(value, ["digest", "path"]) === false)
        return "must contain only path and digest";
    if (typeof value.path !== "string")
        return "path must be a string";
    if (typeof value.digest !== "string")
        return "digest must be a string";
    return null;
};
