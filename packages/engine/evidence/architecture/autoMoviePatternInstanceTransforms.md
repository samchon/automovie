# src/architecture/autoMoviePatternInstanceTransforms.ts#autoMoviePatternInstanceTransforms

## @evidence contracts/development/implementation.md#principled-implementation

Computes basis `(U cos θ + V sin θ, N × that, N)` and converts it through `quaternionFromAutoMovieBasis`; translation uses the developed panel offset. Frame checks admit approximate orthogonality within `1e-6`, so the quaternion is a numerical TRS representation rather than an exact affine factorization. Placement fields and finite intermediate results are caller premises, not independently revalidated here.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates and resolves every panel once, then maps each whole placement to one slot; the slot shape is the interface's explicit instance transform, so no second instancing record is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no zone, module or production; a cut piece is reported for geometry instead of being approximated by a scaled whole module, and a missing prototype throws instead of falling back to the set default.

## @evidence contracts/development/common.md#meaningful-documentation

States why whole modules become slots and cut ones do not, how id, rotation, scale and prototype are derived, the local axis mapping, the facet rule, the metre unit of thickness, and every throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(Z + F + N) for quantity-zone records, facets and placements: builds the known-zone set and facet map once, then performs constant basis/slot work per whole placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every placement of a zone reuses that zone's resolved panel basis instead of re-validating its frame; nothing is reused across calls, since the result and frames are inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The panel map is dropped on return; the caller owns the slots and cut ids, together bounded by the placement count.
