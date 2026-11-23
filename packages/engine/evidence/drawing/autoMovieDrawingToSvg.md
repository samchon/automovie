# src/drawing/autoMovieDrawingToSvg.ts#autoMovieDrawingToSvg

## @evidence contracts/development/implementation.md#principled-implementation

Maps page metres to SVG user units in millimetres by the drafting-scale factor and flips y once, writes geometry as plain `line`, `polygon` and `text` elements with semantic `data-*` attributes, and escapes the five XML special characters in every value, so the output is well-formed for any authored text.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One serializer owns pen validation, page placement and element emission; the tag, escape, number and point helpers are private because no other module writes SVG.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No drawing or view is special-cased; stale and outline-less items are emitted as empty groups by a stated rule rather than dropped, and a mismatched or invalid pen throws instead of being replaced by defaults.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states every element and attribute family, the scale and page mapping, the margin, the flip, rounding and escaping, every refusal, and the exact output shape.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over each array of the drawing emitting one element each, so time and output are linear in the drawing's size; the body is joined once at the end instead of by repeated concatenation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure serializer called once per sheet; nothing equivalent repeats within a call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Builds the body strings for one call and returns one string owned by the caller; nothing is retained.
