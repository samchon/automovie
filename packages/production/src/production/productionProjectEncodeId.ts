import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Encode a nonblank authored identity as one canonical path segment.
 *
 * @evidence contracts/common.md#principled-implementation Refuses whitespace-only ids, then delegates canonical segment representation to encodeAutoMoviePathSegment; additional production-only portable-id constraints stay with validateProductionId.
 * @evidence contracts/common.md#clear-and-simple-design Shared design, review, receipt and production paths use one encoding owner instead of ad hoc separators or escaping rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not trim or case-fold the authored id, and segment encoding alone is not physical path containment or a complete production registry admission.
 * @evidence contracts/common.md#meaningful-documentation Short ids use URI segment encoding and long ids use a SHA-256 address, so the result is not always reversible; blank refusal precedes path construction and production-id admission remains separate.
 * @evidence contracts/performance.md#efficient-algorithms Trimming and delegated segment encoding cost time/space proportional to id length, without registry lookup or directory enumeration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure scalar encoding has no acquisition/effect to share; enclosing attempts reuse their computed segment when they own repeated routing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers one encoded string and retains no input cache, descriptor, lock or task.
 */
export function productionProjectEncodeId(id: string): string {
    if (id.trim().length === 0)
        throw new Error("AutoMovie design and review ids must not be blank.");
    return encodeAutoMoviePathSegment(id);
}
