import { IAutoMovieGeneratedManifest } from "@automovie/interface";

/**
 * Manifest, expected compile fingerprint and byte-reading capability for one generated film artifact attempt.
 *
 * @evidence contracts/common.md#principled-implementation Carries one observed manifest and a caller-established fingerprint, while parsers compare declared digest with each returned byte population. Reads are sequential observations, not an atomic filesystem snapshot.
 * @evidence contracts/common.md#clear-and-simple-design The same input shape supplies timeline and effect admission without coupling parsers to project state or adding a host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The read capability must return truthful bytes; the shape alone proves no manifest ownership, currentness or namespace identity.
 * @evidence contracts/common.md#meaningful-documentation Defines optional manifest absence, expected compile identity and manifest-relative byte reads; parser owners perform the actual comparisons.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface executes no traversal or decoding; readers/parsers own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One captured manifest can be shared within an attempt, but the shape supplies no cross-attempt cache or atomicity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns manifest data and returned buffers; the declaration acquires no descriptor or task.
 * @author Samchon
 */
export interface IAutoMovieFilmTimelineArtifact {
    /**
     * Current generated manifest.
     */
    manifest: IAutoMovieGeneratedManifest | null;

    /**
     * Compile fingerprint the consumer already established as current.
     */
    fingerprint: string;

    /**
     * Acquire bytes for one path declared by this attempt's observed manifest.
     *
     * @evidence contracts/common.md#principled-implementation The parser passes its declared path to a synchronous reader; project adapters use owned generated-file admission, while other supplied readers must return truthful bytes.
     * @evidence contracts/common.md#clear-and-simple-design One byte capability keeps artifact validation independent of project acquisition without adding a filesystem host.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest comparison stays with the parser; this type promises no atomic snapshot and does not admit fabricated bytes.
     * @evidence contracts/common.md#meaningful-documentation Defines manifest-relative input, returned byte ownership and propagated acquisition failures.
     * @evidence contracts/performance.md#efficient-algorithms Project readers include root/path observations and a full B-byte guarded read; other implementations own their acquisition costs.
     * @evidence contracts/performance.md#reuse-equivalent-work One capability can serve distinct artifact paths without caching previous pathname observations.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The implementation owns native acquisition/release and transfers bytes; the callback declaration retains no buffer or descriptor.
     */
    read(path: string): Uint8Array;
}
