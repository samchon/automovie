/**
 * One ordered, domain-separated byte field of a production fingerprint.
 *
 * @evidence contracts/common.md#principled-implementation Separates role, encoding/domain kind and exact payload bytes; fingerprintAutoMovieFields frames each component with its UTF-8 or byte length so adjacent values cannot collide by concatenation ambiguity.
 * @evidence contracts/common.md#clear-and-simple-design Build, derivation, render and rendition owners compose these fields while the shared fingerprint encoder owns framing and hashing; no producer-specific payload interpretation enters the carrier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty components remain valid addressed values and payload bytes are hashed unchanged; source equivalence belongs to the composer. Role/kind labels use Node UTF-8 replacement for unpaired surrogates, so this type does not establish a scalar-safe or injective string-label domain.
 * @evidence contracts/common.md#meaningful-documentation States component domains, exact bytes and ordered composition; caller-owned payloads must remain stable during synchronous fingerprint evaluation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The carrier chooses no encoding traversal or hash algorithm; its composer and fingerprintAutoMovieFields own that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The field describes neither a stored digest nor evidence of equivalent mutable inputs; reuse proof belongs to build/publication owners.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callers own payload buffers and field populations; this interface creates no retained store, file handle or task.
 * @author Samchon
 */
export interface IAutoMovieFingerprintField {
  /** Semantic role, such as protocol, design or source. */
  role: string;

  /** Payload encoding or domain subtype. */
  kind: string;

  /** Exact stable payload bytes consumed synchronously by the fingerprint owner. */
  payload: Uint8Array;
}
