# src/scene/inspection/measureAutoMoviePlacedObligation.ts#measureAutoMoviePlacedObligation

## @evidence contracts/development/common.md#meaningful-documentation

States the track, native and canonical cases, the unavailable rules and the witness contents.

## @evidence contracts/development/implementation.md#principled-implementation

Native nodes are read as drawn and converted into rigid frames with the shared tolerance; limits and measures come from Engine.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One dispatch on the input kind, then one adapter per relation family.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No matrix is recomposed and no missing node implies a passing relation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per obligation plus one ancestor walk per newly read node.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The matrix index shares displayed matrix reads across obligations of one sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The index belongs to the caller's request; the result holds plain values.
