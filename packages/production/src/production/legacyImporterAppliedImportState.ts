

/**
 * Persisted import incarnation: exact version one, the semantic plan fingerprint and a lowercase v4 UUID. The applied-state reader validates these values before exact-state comparison.
 *
 * @evidence contracts/common.md#principled-implementation Binds one incarnation to one admitted plan digest, separating imported state identity from the legacy revision stored in the plan.
 * @evidence contracts/common.md#clear-and-simple-design A three-field record supplies publication, verification and restoration without retaining the whole plan twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type annotations do not authenticate JSON; exact shape, fingerprint equality and UUID format remain explicit runtime admission requirements.
 * @evidence contracts/common.md#meaningful-documentation Documents version, fingerprint and incarnation meanings plus their validating owner.
 * @evidence contracts/performance.md#efficient-algorithms This interface performs no computation; JSON validation and UUID/fingerprint checks are charged to the applied-state reader.
 * @evidence contracts/performance.md#reuse-equivalent-work An admitted state is shared within one verification/restoration attempt; the type supplies no cache across mutable persisted files.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Contains scalar state identity and no handle; publication/rollback callers own record retention and any associated filesystem leases.
 * @author Samchon
 */
export interface legacyImporterAppliedImportState {
  /** Persisted applied-state protocol version, admitted exactly as one. */
  version: 1;

  /** Semantic plan digest to which these provenance bytes belong. */
  fingerprint: string;

  /** Version-four UUID identifying this imported production-state incarnation. */
  incarnation: string;
}
