import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";

/**
 * Derive deterministic occurrence identity from its compile fingerprint before publication. These caller-admitted strings enter canonical domain-separated bytes; this digest is a logical source identity, not a hash of rendered media.
 *
 * @evidence contracts/common.md#principled-implementation The deterministic-visual-source-v1 protocol binds compile identity and occurrence through the common canonical UTF-8/SHA-256 owner.
 * @evidence contracts/common.md#clear-and-simple-design Logical lane identity is separate from resident artifact hashing and final delivery publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated shots remain distinct by occurrence, but the function does not validate supplied compile text or inspect rendered bytes.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes a caller-admitted logical identity from actual media content.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-key canonicalization and UTF-8 hashing scale with the two input strings; no frame population is traversed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar composer owns no source-render request cache or in-flight result coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canonical text/bytes expire synchronously and only the digest escapes without a render or file resource.
 */
export const productionDeterministicVisualSourceDigest: (props: {
    compileFingerprint: string;
    occurrence: string;
}) => string = (props: {
  compileFingerprint: string;
  occurrence: string;
}): string =>
  digestAutoMovieBytes(
    canonicalAutoMovieJsonBytes({
      protocol: "automovie.deterministic-visual-source.v1",
      compileFingerprint: props.compileFingerprint,
      occurrence: props.occurrence,
    }),
  );
