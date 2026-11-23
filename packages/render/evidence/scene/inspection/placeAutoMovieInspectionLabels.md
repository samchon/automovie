# src/scene/inspection/placeAutoMovieInspectionLabels.ts#placeAutoMovieInspectionLabels

## @evidence contracts/development/common.md#meaningful-documentation

States the pixel convention, the box and where it comes from, the order and the three reasons a label is dropped, the camera premise and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A world point is projected through the camera's view and projection to normalized device coordinates and mapped to pixels with y flipped, three.js's own projection; the box matches the stamp's glyph metrics, so a host that stamps the labels draws them where their overlap was decided.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection per box centre, then one greedy pass that keeps a label when it overlaps no kept box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A label is never moved to make room, so every kept label sits at its own anchor, and none is silently lost.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quadratic in the labels kept, which a legible picture holds tens of.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one camera and one set of anchors.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and keeps nothing.
