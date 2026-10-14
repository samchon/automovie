import { decodeAutoMovieUtf8 } from "./strictUtf8";
import type { IAutoMovieSourceIdentity } from "./IAutoMovieSourceIdentity";
import { AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL } from "./AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL";
import { digestAutoMovieBytes } from "./digestAutoMovieBytes";

/**
 * Normalize source and expose both exact-byte and semantic identities.
 *
 * @evidence contracts/common.md#principled-implementation Exact source bytes and their strict BOM/EOL projection are hashed separately under the current source protocol.
 * @evidence contracts/common.md#clear-and-simple-design One record keeps raw and semantic identity together so callers cannot substitute permitted equivalence for exact-byte identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The path labels strict decoding errors without altering bytes or salting their digest. The caller supplies a host-supported byte view whose contents remain stable across decoding and raw hashing; this function does not copy or seal that input.
 * @evidence contracts/common.md#meaningful-documentation Documents rawDigest versus semanticDigest, normalized byte ownership and protocol meaning.
 * @evidence contracts/performance.md#efficient-algorithms Strict normalization and two SHA-256 passes cost O(B) time with normalized bytes and decoded text proportional to B.
 * @evidence contracts/performance.md#reuse-equivalent-work The normalized buffer is reused for semantic hashing; raw and normalized digests intentionally describe distinct byte domains.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record owns fresh normalized bytes and digest strings; the original input is neither retained nor changed.
 */
export const normalizeAutoMovieSourceIdentity: (props: {

    /**
     * Source-relative pathname named by any decoding refusal.
     */
    path: string;

    /**
     * Exact authored source bytes.
     */
    bytes: Uint8Array;
}) => IAutoMovieSourceIdentity = (props: {

    /**
     * Source-relative pathname named by any decoding refusal.
     */
    path: string;

    /**
     * Exact authored source bytes.
     */
    bytes: Uint8Array;
}): IAutoMovieSourceIdentity => {
    const text: string = decodeAutoMovieUtf8({
        record: props.path,
        bytes: props.bytes,
        leadingBom: "strip",
    });
    const normalized: Buffer = Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
    return {
        protocol: AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL,
        rawDigest: digestAutoMovieBytes(props.bytes),
        normalized,
        semanticDigest: digestAutoMovieBytes(normalized),
    };
};
