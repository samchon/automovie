import { AutoMovieCanonicalJsonError } from "@automovie/engine";
import { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";
import type { IAutoMovieCanonicalJsonIdentity } from "./IAutoMovieCanonicalJsonIdentity";
import { identifyAutoMovieCanonicalJson } from "./identifyAutoMovieCanonicalJson";

/**
 * Canonicalize under an explicitly selected current protocol.
 *
 * @evidence contracts/common.md#principled-implementation A runtime protocol equality guard admits only the current v2 canonical domain before identity derivation.
 * @evidence contracts/common.md#clear-and-simple-design Explicit protocol selection stays at this boundary; canonical representation remains the engine's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Another protocol string receives the typed unsupported-value refusal even when a caller bypasses the literal type. The refusal formats JSON.stringify(props.protocol), so arbitrary nonstring JavaScript inputs can fail during that formatting instead; no predecessor protocol is silently selected.
 * @evidence contracts/common.md#meaningful-documentation States current-only protocol admission and unchanged engine domain errors.
 * @evidence contracts/performance.md#efficient-algorithms Supported protocol admission adds a constant comparison to complete canonical traversal/key sorting, UTF-8 encoding and SHA-256; a refused protocol also pays for its diagnostic spelling. Encoded occurrences and canonical output bytes drive the delegated cost without a size cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work Delegates to the same identity producer used by verification; no separate encoder or protocol result cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the resulting identity record transfers to the caller; a refused protocol acquires no encoder buffer or handle.
 */
export const canonicalizeAutoMovieJsonForProtocol: (props: {

    /**
     * Required current algorithm identity.
     */
    protocol: typeof AUTOMOVIE_CANONICAL_JSON_PROTOCOL;

    /**
     * Structured value in the declared accepted domain.
     */
    value: unknown;
}) => IAutoMovieCanonicalJsonIdentity = (props: {

    /**
     * Required current algorithm identity.
     */
    protocol: typeof AUTOMOVIE_CANONICAL_JSON_PROTOCOL;

    /**
     * Structured value in the declared accepted domain.
     */
    value: unknown;
}): IAutoMovieCanonicalJsonIdentity => {
    if (props.protocol !== AUTOMOVIE_CANONICAL_JSON_PROTOCOL)
        throw new AutoMovieCanonicalJsonError("unsupported-value", `protocol ${JSON.stringify(props.protocol)} is not current`);
    return identifyAutoMovieCanonicalJson(props.value);
};
