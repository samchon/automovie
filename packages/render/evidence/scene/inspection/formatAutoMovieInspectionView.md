# src/scene/inspection/formatAutoMovieInspectionView.ts#formatAutoMovieInspectionView

## @evidence contracts/development/common.md#meaningful-documentation

States the text of each form, the switch order and the round trip it guarantees.

## @evidence contracts/development/implementation.md#principled-implementation

The writer mirrors the parser form by form, and `String` of a finite number is the shortest text that reads back as that number, so the round trip is exact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Switches are written in one fixed order, so one view has one text.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the length of the written text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one view.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh string and keeps nothing.
