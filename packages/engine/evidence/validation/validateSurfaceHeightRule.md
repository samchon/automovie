# src/validation/validateSurfaceHeightRule.ts#validateSurfaceHeightRule

## @evidence contracts/development/implementation.md#principled-implementation

Admit constant/plane finite parameters or a finite heightfield with positive pitch, safe dimensions>=2 and exact row-major count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The closed variant switch aligns metadata with height-rule query fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown kinds report an error; scalar finiteness does not guarantee representable extreme products.

## @evidence contracts/development/common.md#meaningful-documentation

Lattice origins/pitch/dimensions/sample paths and null-free variant semantics are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

S lattice samples require O(S) finite checks, with fixed other fields.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

finiteHeight and positiveSpacing share scalar checks across variants.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only collector rows remain, while samples stay borrowed without a terrain resource.
