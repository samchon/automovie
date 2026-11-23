# src/geometry/construction/markAutoMovieConstructionCurves.ts#markAutoMovieConstructionCurves

## @evidence contracts/development/common.md#meaningful-documentation

States what each curve becomes, the kind, path, frame and flag rules, tabulates each kind's label and colour, and shows the call beside the sampler.

## @evidence contracts/development/implementation.md#principled-implementation

The sampler reads a realization in its object's frame at rest, so each curve keeps its points untouched and names that object as its anchor; the curve's id already carries its part and ordinal, so the path is the anchor's path followed by the id.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the curves with one fixed table of the three kinds' legend entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The colours are the hues the inspection has always drawn these kinds in, one per kind so none can be mistaken for another, and no part or chain name is read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the curves; each mark shares its curve's point array instead of copying it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of its arguments that coordinates nothing across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The marks borrow the curves' point arrays, so a caller that changes a curve changes its mark; nothing else is kept.
