# src/drawing/autoMovieDrawingExtent.ts#autoMovieDrawingExtent

## @evidence contracts/development/implementation.md#principled-implementation

The axis-aligned bounds of every placed page point, which is the smallest box containing them; the stated limitation is that note text beyond its anchor is not measured.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns which drawing content counts toward the page, so the record's extent and the serialized sheet size cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No content kind is special-cased beyond the documented rule that stale targets have no position, and no margin is added here because the serializer owns the sheet border.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states every contributing point, why annotations count, the note-anchor limitation and the stale rule, and the empty result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fold over every placed point with four running extremes, linear time and constant extra space, without building a combined point array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per derivation over that derivation's own content; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds four numbers during the fold and returns one small record.
