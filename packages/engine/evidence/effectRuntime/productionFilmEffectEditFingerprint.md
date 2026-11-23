# src/effectRuntime/productionFilmEffectEditFingerprint.ts#productionFilmEffectEditFingerprint

## @evidence contracts/development/implementation.md#principled-implementation

A content address: canonical JSON orders members by code unit and refuses non-finite numbers and lone surrogates, so equal edits serialize to equal bytes on every runtime and the FIPS 180-4 SHA-256 in `autoMovieRenderDigest` maps them to one digest; an absent `frameRate` is omitted by the canonicalizer, so a legacy integer timeline keeps its prior identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the protocol tag and the field selection, and the film-effect writer's caller, the population verifier and the render planner all call it, so no consumer can hash a different subset of the timeline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The digest is recomputed from the timeline on every call rather than read from any persisted field, and the provenance fields are excluded by an explicit allow-list rather than by deleting keys from a copy.

## @evidence contracts/development/common.md#meaningful-documentation

States the protocol tag, exactly which timeline fields enter the digest and which are left out and why, the byte encoding and hash, and that the browser and Node paths agree.

## @evidence contracts/development/implementation.md#efficient-algorithms

Canonicalization traverses the timeline and sorts each object's K keys, adding sum(K log K) work to serialization and the linear SHA-256 byte pass; the tagged record is shallow, while the canonicalizer builds its ordered representation and string.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Recomputes each call because the timeline is a plain mutable record with no version token: an identity-keyed cache could survive an in-place edit. Consumers share the field-selection rule, not a cached computation; the render planner computes its edit identity and its population-verification call computes the digest again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The canonical string and its byte array are released when the call returns; only the 71-character digest string is retained by the caller.
