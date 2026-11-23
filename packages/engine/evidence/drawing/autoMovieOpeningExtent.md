# src/drawing/autoMovieOpeningExtent.ts#autoMovieOpeningExtent

## @evidence contracts/development/implementation.md#principled-implementation

The axis-aligned bounds of `outlineHull`, which contains every arc of at most a half turn; the limitation that a tilted chord's hull overstates the arc is stated, and accepted because the reported size must be the size the wall kernel cuts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the architecture owners `outlineHull` and `polygonBounds` and adds only grid rounding, so the drawing, schedule and wall cut share one rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening is special-cased and no finer arc measurement is substituted, because a schedule that measured more finely would print a width no hole has.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the frame and axes, the rounding, why the hull is used, and when it is tight or loose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the outline's edge count: one hull pass and one bounds pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per opening per drawing or schedule; nothing equivalent repeats within one call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The hull is a temporary released when the call returns; only a two-number record is returned.
