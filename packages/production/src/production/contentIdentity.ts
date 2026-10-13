// The canonical JSON v2 implementation and its code-unit order are the
// engine's, so a browser consumer computes the identity without this Node
// module and both packages sort with one comparator. These names stay
// reachable here because Node project services import them from this module.
export { AutoMovieCanonicalJsonError, type AutoMovieCanonicalJsonErrorCategory, canonicalizeAutoMovieJson, compareCodeUnits, } from "@automovie/engine";
export type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
export { fingerprintAutoMovieFields } from "./fingerprintAutoMovieFields";
export { autoMovieExternalLocatorRefusal } from "./autoMovieExternalLocatorRefusal";
export { AUTOMOVIE_BUILD_FINGERPRINT_PROTOCOL } from "./AUTOMOVIE_BUILD_FINGERPRINT_PROTOCOL";
export { AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL } from "./AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL";
export { AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL } from "./AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL";
export { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";
export { AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL";
export { AUTOMOVIE_CANONICAL_JSON_DOMAIN } from "./AUTOMOVIE_CANONICAL_JSON_DOMAIN";
export type { IAutoMovieSourceIdentity } from "./IAutoMovieSourceIdentity";
export type { IAutoMovieSourceIdentityVerification } from "./IAutoMovieSourceIdentityVerification";
export type { IAutoMovieCanonicalJsonIdentity } from "./IAutoMovieCanonicalJsonIdentity";
export type { IAutoMovieCanonicalJsonVerification } from "./IAutoMovieCanonicalJsonVerification";
export { normalizeAutoMovieSource } from "./normalizeAutoMovieSource";
export { normalizeAutoMovieSourceIdentity } from "./normalizeAutoMovieSourceIdentity";
export { verifyAutoMovieSourceIdentity } from "./verifyAutoMovieSourceIdentity";
export { digestAutoMovieBytes } from "./digestAutoMovieBytes";
export { encodeAutoMoviePathSegment } from "./encodeAutoMoviePathSegment";
export { decodeAutoMoviePathSegment } from "./decodeAutoMoviePathSegment";
export { identifyAutoMovieCanonicalJson } from "./identifyAutoMovieCanonicalJson";
export { canonicalizeAutoMovieJsonForProtocol } from "./canonicalizeAutoMovieJsonForProtocol";
export { verifyAutoMovieCanonicalJsonIdentity } from "./verifyAutoMovieCanonicalJsonIdentity";
export { canonicalAutoMovieJsonBytes } from "./canonicalAutoMovieJsonBytes";
