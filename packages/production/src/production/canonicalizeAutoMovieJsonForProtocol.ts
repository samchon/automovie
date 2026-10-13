import { AutoMovieCanonicalJsonError } from "@automovie/engine";
import { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";
import type { IAutoMovieCanonicalJsonIdentity } from "./IAutoMovieCanonicalJsonIdentity";
import { identifyAutoMovieCanonicalJson } from "./identifyAutoMovieCanonicalJson";

/**
 * Canonicalize under an explicitly selected current protocol.
 *
 * @evidence contracts/common.md#principled-implementation A runtime protocol equality guard admits only the current v2 canonical domain before identity derivation.
 * @evidence contracts/common.md#clear-and-simple-design Explicit protocol selection stays at this boundary; canonical representation remains the engine's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Even JavaScript callers bypassing the literal TypeScript type receive a typed unsupported-value refusal for another protocol.
 * @evidence contracts/common.md#meaningful-documentation States current-only protocol admission and unchanged engine domain errors.
 * @evidence contracts/performance.md#efficient-algorithms The scalar guard adds constant work to complete canonical encoding and SHA-256 over the admitted value.
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
