# src/cache/encodeAutoMovieArtifactJson.ts#encodeAutoMovieArtifactJson

## @evidence contracts/development/implementation.md#principled-implementation

A JSON replacer tags exactly the numbers RFC 8259 cannot represent, and a structural check before serialization refuses values JSON would silently change, so encode then decode is the identity on every accepted value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One generic codec beside the artifact resolver serves every stage whose output is plain data; stages own their types.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported values throw with their path instead of being coerced.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal to validate and one to serialize, linear in the value's size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure codec coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the JSON text and the returned bytes only for the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the tagged numbers, the accepted value domain, ordering, undefined handling and lost reference identity.
