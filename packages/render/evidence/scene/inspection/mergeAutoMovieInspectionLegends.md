# src/scene/inspection/mergeAutoMovieInspectionLegends.ts#mergeAutoMovieInspectionLegends

## @evidence contracts/development/common.md#meaningful-documentation

States the merge key, the order kept and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The label is the meaning of a colour, so entries are summed by label and a second colour under one label is a contradiction, not a variant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map from label to the entry being accumulated, read back in insertion order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A colour conflict is refused instead of resolved by keeping the first.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of entries, with one hashed lookup each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The curve builder, the defect builder and the scene inspection all tally through this one function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The result is a fresh list of fresh entries and the inputs are not kept or changed.
