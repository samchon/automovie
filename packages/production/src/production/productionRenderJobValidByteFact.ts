import { productionRenderJobValidDigest } from "./productionRenderJobValidDigest";

/**
 * Admit claimed positive safe byte count and canonical digest syntax.
 *
 * @evidence contracts/common.md#principled-implementation Checks Number.isSafeInteger, positive count and the shared digest predicate; the caller owns relating those claims to resident payloads.
 * @evidence contracts/common.md#clear-and-simple-design Frame and encoded receipt facts use one lightweight syntactic check.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No claimed byte count or digest proves payload presence, media format or content agreement by itself.
 * @evidence contracts/common.md#meaningful-documentation States safe-positive count and digest syntax, without naming this media probing.
 * @evidence contracts/performance.md#efficient-algorithms Fixed numeric checks plus fixed-profile digest text scanning; no bytes are read or hashed.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the engine digest-pattern owner through one predicate, retaining no verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean transfers; no payload, handle or task is acquired.
 */
export function productionRenderJobValidByteFact(fact: {
    /** Claimed SHA-256 content digest; no payload is supplied for comparison. */
    digest: string;

    /** Claimed byte count required to be a positive safe integer. */
    bytes: number;
}): boolean {
    return Number.isSafeInteger(fact.bytes) &&
        fact.bytes > 0 &&
        productionRenderJobValidDigest(fact.digest);
}
