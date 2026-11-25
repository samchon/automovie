# src/geometry/construction/AutoMovieLoftParameter.ts#AutoMovieLoftParameter.phases

## @evidence contracts/development/implementation.md#principled-implementation

Uses an area-centroid reference and dispatches to polar unwrapping or oriented edge arclength; simple oriented polygons with the selected rule's anchors/star shape are caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One entry point keeps the rule and reference-point calculation common to fitted and inherited section correspondences.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains centroid's near-zero-area mean fallback, anchored crossing failure and 1e-12 length divisors; it does not independently validate a simple or nondegenerate polygon.

## @evidence contracts/development/common.md#meaningful-documentation

Gives input orientation, no repeated endpoint, returned phase convention and the reference point's sampling-density rationale.

## @evidence contracts/development/implementation.md#efficient-algorithms

On the stated simple section workload, centroid and rule mapping traverse N vertices in O(N) time with O(N) phase/crossing/length storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes one reference point; anchored mapping shares its crossing list and cumulative arclength table across all returned phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the N-entry phase array escapes; polygon references and intermediate crossings/lengths are call-local, with no module cache.

# src/geometry/construction/AutoMovieLoftParameter.ts#AutoMovieLoftParameter.centroid

## @evidence contracts/development/implementation.md#principled-implementation

The polygon shoelace first moment divided by signed area gives its centroid for a simple nonzero-area outline, assuming representable coordinate products.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One edge loop accumulates area and both first moments, with a separate mean fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absolute twice-area magnitude below 1e-9 in squared input units uses the vertex mean; this sampling-dependent fallback and empty-input zero result are not geometric centroid certificates.

## @evidence contracts/development/common.md#meaningful-documentation

States X/Z coordinates, area method and fallback; the evidence identifies the actual numerical threshold and its units.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) time and constant accumulator storage; the fallback makes one additional linear pass only for the near-zero-area branch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Area and both first moments share each edge's signed cross product.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pair and retains no polygon or auxiliary table.
