# src/render/verifyAutoMovieSemanticMask.ts#verifyAutoMovieSemanticMask

## @evidence contracts/development/implementation.md#principled-implementation

Require explicit current version/protocol, exact record key sets and collection/member container shapes, then recompute the complete canonical payload digest; historical format, invalid shape and mismatch have distinct typed refusals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Runtime schema admission precedes projection so unknown/missing fields cannot disappear into a valid-looking hash; scalar value/semantic graph validity remains the derivation/caller responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A recomputed digest cannot authorize extra fields or wrong containers, and historical masks are not normalized into v2. This guard does not rederive FNV colors or prove owner links merely from a hash.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state current identity, complete payload and the structural versus graph/value boundary; all failures use the canonical error class for receipt classification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Record-key/container checks scan E entries and G gaps, then canonical sorting/SHA consumes payload bytes B; temporary storage includes sorted keys, projected records and hash bytes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The verifier reuses canonical payload and digest owners; mutable supplied masks are rehashed on each evidence admission instead of trusting cached identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Verification retains no mask or bytes after success/failure; the catcher owns errors, and no pixel buffer, renderer resource or task is opened.
