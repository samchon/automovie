/**
 * Synchronous access to the resident bytes of an external glTF buffer or image.
 *
 * The host receives the exact declared URI without decoding or normalization and returns borrowed bytes, or null when unavailable. Keep returned storage stable until inspection returns or throws. The payload gate invokes this capability once per external buffer or image declaration, including repeated URIs; data URIs are decoded internally. Host effects and exceptions propagate. Ingest performs no fetching or URI caching.
 *
 * @param uri Exact non-data URI from the inspected glTF declaration.
 * @returns Borrowed resident bytes or null; the payload gate checks exact declared buffer lengths and nonempty image data, without decoding image media.
 *
 * @evidence contracts/development/design.md#principled-representation One exact URI maps synchronously to resident bytes or explicit absence; byte extent and image presence are admitted by validatePayloadClosure, while stable borrowed storage remains the host's lifetime obligation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inspection input and payload gate share this one buffer/image resolution capability; filesystem policy, loading and retained host state remain outside the contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The capability declares no fallback bytes, asynchronous completion, URI rewriting or image validity certificate; null preserves unavailable data for the gate's refusal.
 * @evidence contracts/development/common.md#meaningful-documentation States exact URI identity, borrowed lifetime, explicit absence, per-declaration invocation, propagated effects and the consumer's limited payload checks.
 * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable type has no body; the host supplies URI resolution and the payload gate owns byte admission.
 * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The alias declares one injected capability without an implementation decomposition.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature executes no branch; the host implementation must honor its exact-URI and borrowed-byte contract.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The type prescribes no lookup or allocation strategy; each invocation's cost belongs to the host.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type coordinates no cache; the payload gate preserves per-declaration effects and the host owns any effect-safe reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The alias acquires no resource; the host owns captured state and must keep returned storage stable during inspection.
 */
export type AutoMovieExternalModelResourceResolver = (
  uri: string,
) => Uint8Array | null;
