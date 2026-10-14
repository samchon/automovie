import { canonicalAutoMovieJsonBytes } from "../contentIdentity";

/**
 * Compare two values through canonical JSON bytes.
 *
 * @evidence contracts/common.md#principled-implementation Each value is separately serialized before byte equality, preserving the canonical owner's object-key and value policy.
 * @evidence contracts/common.md#clear-and-simple-design Tier projection and current-publication comparison share one equality owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Byte equality assumes both synchronous input values are stable and does not acquire current filesystem or runtime state.
 * @evidence contracts/common.md#meaningful-documentation Defines full canonical equality rather than selected-field or digest-only equality.
 * @evidence contracts/performance.md#efficient-algorithms Includes both complete traversals/key ordering/encodings and byte comparison; Bleft+Bright encoded bytes can coexist.
 * @evidence contracts/performance.md#reuse-equivalent-work Each side is serialized once for this comparison, with no result cache across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two temporary buffers expire on return/refusal; original objects remain borrowed and no handle or task is acquired.
 */
export const productionPublicationSameCanonicalJson: (left: unknown, right: unknown) => boolean = (left: unknown, right: unknown): boolean => Buffer.from(canonicalAutoMovieJsonBytes(left)).equals(Buffer.from(canonicalAutoMovieJsonBytes(right)));
