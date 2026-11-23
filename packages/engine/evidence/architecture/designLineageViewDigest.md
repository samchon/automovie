# src/architecture/designLineageViewDigest.ts#designLineageViewDigest

## @evidence contracts/development/implementation.md#principled-implementation

Hashes length-prefixed view/revision/change/state records and recorded subject digests after snapshot validation. Equal serializations hash equally; changed content is not guaranteed a distinct hash, and lone UTF-16 surrogates can share UTF-8 replacement bytes. The snapshot establishes resolvable revision/phase premises, not inspection of external asset bytes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Presence comes from `designLineagePhaseSnapshot`, which also validates, the variant lookup from `requireDesignVariant`, and the line encoding from `designLineageRecord`, so this function owns only which facts form a view.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no lineage, variant or phase; a null variant is the head revision for every lineage rather than a default for one caller.

## @evidence contracts/development/common.md#meaningful-documentation

States what the digest is a handle for, which differences move it, the meaning of a null variant and a null phase, the change order, the included subject digests, the format, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full phase-snapshot/lineage-validation cost, variant/revision scans, subject indexing, C-change sorting and serialized-byte hashing. Snapshot prerequisite/lifecycle work and validation fairness can be superlinear; comparisons and hashing also depend on authored string lengths.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Digests one view per call from the caller's mutable record; a cached digest could not prove the lineage or subject bytes unchanged.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the snapshot, index and lines only for the call and returns one digest string.
