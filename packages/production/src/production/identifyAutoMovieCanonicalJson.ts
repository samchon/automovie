import type { IAutoMovieCanonicalJsonIdentity } from "./IAutoMovieCanonicalJsonIdentity";
import { canonicalAutoMovieJsonBytes } from "./canonicalAutoMovieJsonBytes";
import { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";
import { digestAutoMovieBytes } from "./digestAutoMovieBytes";

/**
 * Create the current versioned canonical JSON identity.
 *
 * @evidence contracts/common.md#principled-implementation The engine admits and canonically orders v2 JSON before UTF-8 encoding and hashing its exact bytes.
 * @evidence contracts/common.md#clear-and-simple-design The identity record joins protocol, canonical bytes and digest for build and migration consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Engine domain refusals propagate; this wrapper neither broadens accepted values nor freezes the caller's object graph.
 * @evidence contracts/common.md#meaningful-documentation Documents fresh byte ownership and current protocol identity; SHA-256 equality is not independent dependency admission.
 * @evidence contracts/performance.md#efficient-algorithms Includes engine traversal and per-object key sorting, then encoding/hash over C canonical bytes; temporary text/bytes scale with C.
 * @evidence contracts/performance.md#reuse-equivalent-work The generated canonical byte buffer is reused for its digest and returned to the caller; no object-identity cache assumes immutable values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the byte buffer and digest; engine ancestry and hash state are released before return.
 */
export const identifyAutoMovieCanonicalJson: (value: unknown) => IAutoMovieCanonicalJsonIdentity = (value: unknown): IAutoMovieCanonicalJsonIdentity => {
    const bytes: Uint8Array = canonicalAutoMovieJsonBytes(value);
    return {
        protocol: AUTOMOVIE_CANONICAL_JSON_PROTOCOL,
        bytes,
        digest: digestAutoMovieBytes(bytes),
    };
};
