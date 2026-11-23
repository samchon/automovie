# src/architecture/builtEnvironmentSpaceFidelity.ts#builtEnvironmentSpaceFidelity

## @evidence contracts/development/implementation.md#principled-implementation

A three-valued fold over the subtree's spaces that state a volume, taking `"faceted"` as absorbing, so the answer is the least exact claim any contributing volume makes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the subtree from the same walk the containment query uses and volume presence from `builtSpaceStatesVolume`, so the fidelity reported is the fidelity of exactly the volumes containment tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space or production and invents no curvature detector; it reports declared fidelity with the documented exact default, rather than silently certifying the represented region.

## @evidence contracts/development/common.md#meaningful-documentation

States the three answers, that only volume-stating spaces count, why the answer folds over descendants, the curved-region limit, that contents never enter, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the space count for the walk and the scan, with the scan stopping at the first faceted volume.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The fold is recomputed from the subtree on every call, since a space's stated volume or fidelity may change in the caller's record and no cached verdict could detect that.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The subtree set is dropped on return; the answer is a string literal.
