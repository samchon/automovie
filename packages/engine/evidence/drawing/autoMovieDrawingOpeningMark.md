# src/drawing/autoMovieDrawingOpeningMark.ts#autoMovieDrawingOpeningMark

## @evidence contracts/development/implementation.md#principled-implementation

Places the drafted outline with the host face's rigid frame and projects it orthographically, the same placement the wall kernel and the drafter use, and sizes the mark with the shared nominal-extent rule; the face's presence is a validation premise, not a runtime guess.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function maps an opening onto the drawing's mark vocabulary, delegating sizing to the rule the schedule shares and outline drafting to `autoMovieOpeningOutlinePoints`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening kind is special-cased; a fill-sized mark is labelled `fill` and draws no outline rather than presenting a leaf as the hole, and an unsized one is `none` rather than zero.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states each basis and what it carries, why a fill-sized mark has no outline, the rounding, and the face premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the profile's drafted points, or in the fill model's triangles through the shared sizing rule; the host boundary is a map lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A fill model's tessellation is reused through the design index across every opening it fills within one derivation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one mark owned by the caller; the drafted outline points are temporaries.
