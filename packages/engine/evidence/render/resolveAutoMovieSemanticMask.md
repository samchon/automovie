# src/render/resolveAutoMovieSemanticMask.ts#resolveAutoMovieSemanticMask

## @evidence contracts/development/implementation.md#principled-implementation

Normalize a requested color to uppercase, find its entry and follow owner ids until root, missing link or cycle; unknown colors return null and malformed ownership yields only the reachable prefix rather than invented ancestry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separate color and id maps support the pixel-to-owner join in one call, with ancestor traversal independent of renderer objects.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No nearest color or fixture label is guessed; this helper does not verify mask digest, uniqueness or scalar schema, so callers requiring evidence admission use the verifier/derivation seam first.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify borrowed entry/ancestors, uppercase lookup, null unknown color and the incomplete-chain behavior on missing/cyclic owner links.

## @evidence contracts/development/implementation.md#efficient-algorithms

E entries build two O(E) maps and at most H owner links are followed, with O(H) returned references; each pixel call currently rebuilds indices, a bulk-resolution reuse limitation rather than constant lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mask's own entry records are reused without copying; no persistent cache assumes mutable entries/ownership remain equivalent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the ancestor array while entries remain mask-owned; local maps/seen set are released and no pixel buffer or native resource is retained.
