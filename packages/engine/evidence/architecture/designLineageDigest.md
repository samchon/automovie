# src/architecture/designLineageDigest.ts#designLineageDigest

## @evidence contracts/development/implementation.md#principled-implementation

Sorts records/id lists by code unit, encodes length-prefixed UTF-16 lines and hashes their UTF-8 encoding with `autoMovieRenderDigest`. Ordering/newline conventions are explicit. Distinct UTF-16 strings containing lone surrogates can encode to the same replacement bytes; SHA-256 also does not provide a mathematical collision-free identity guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One canonical line per record kind, using the shared line encoder and validation guard rather than private copies; the citation omission is explained where it happens.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no lineage or record; the one omitted field is omitted for every lineage because validation makes it derivable, not to match a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States the canonical ordering and why, the separator ownership, which fields are serialized, why citations are not, the digest format, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays complete lineage validation, including prerequisite walks and decision-by-artifact fairness, then collection/nested-id sorting, serialization and hashing. Sort comparisons cost their compared code-unit lengths; the serialization-size term includes all nested fields rather than only top-level record count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Digests the record it is handed each call; a cached digest could not prove the caller's mutable record unchanged.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the sorted copies and serialized lines only for the call and returns one digest string.
