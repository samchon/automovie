# src/geometry/canonicalRegion.ts#canonicalRegion

## @evidence contracts/development/implementation.md#principled-implementation `autoMoviePlanarRegionFailure` admits the rings first, then the shoelace signed area decides each ring's winding and a reversal fixes it, which permutes corners but never adds, merges or moves one, so `sourceIndices` stays a permutation of the input.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation and layout are separated from ear clipping so `triangulateRegion` and the loft share one admission while only the caller that needs triangles pays for them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failing region throws its own named diagnostic rather than being repaired, and reversal is the only normalization, applied identically to every sweep ring of the same winding so corner correspondence survives.

## @evidence contracts/development/common.md#meaningful-documentation

States the copy and winding rules, the ring order, what `sourceIndices` addresses, that inputs are read only, why `label` exists, and why triangles are not cut here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the total point count after validation: one copy, one signed area and at most one reversal per ring, plus one area sum; validation cost is answered on `autoMoviePlanarRegionFailure`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sweep mesher calls it once per ring and reuses each layout for that ring's walls and, at the ends, its cap, so no ring is validated or laid out twice.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns newly owned point, index and ring arrays linear in the input point count; the per-ring working copies become those arrays and nothing else is retained.
