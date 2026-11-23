# src/cache/decodeAutoMovieArtifactJson.ts#decodeAutoMovieArtifactJson

## @evidence contracts/development/implementation.md#principled-implementation

A JSON reviver replaces exactly the `{"$number": tag}` objects the encoder writes, and the encoder refuses plain objects owning that member, so no data object is mistaken for a tag.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inverse of the generic encoder, kept beside it; stage types stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed text or an unknown tag throws instead of producing a partial value.

## @evidence contracts/development/implementation.md#efficient-algorithms

One UTF-8 decode and one parse, linear in byte length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure codec coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the decoded text only for the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the restored numbers, the type premise and the versioning consequence.
