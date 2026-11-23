# src/drawing/autoMovieOpeningNominalExtent.ts#autoMovieOpeningNominalExtent

## @evidence contracts/development/implementation.md#principled-implementation

Prefers the profile's hull extent from `autoMovieOpeningExtent`, which is the cut the wall kernel makes, and otherwise measures the fill's placed triangles with `autoMovieOpeningFillExtent`; validation guarantees a profiled opening's host has a face and a fill resolves, the premises these readings rely on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one sizing rule the drawing's opening marks and the schedule's opening rows share, returning a basis each caller maps onto its own vocabulary of `none` or `unmeasured`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening kind is special-cased; a stand-in measurement is labelled `fill` rather than passed off as the hole's size, and an unmeasurable opening is `null` rather than zero.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the precedence, what each basis means, every case that yields `null`, the units and rounding, and which consumers share the rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the profile's edges for a void, or in the fill model's triangles for a stand-in, measured in three folds without argument spreading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A fill model's tessellation is reused through the design index, so many openings filled by one leaf model tessellate it once per derivation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The placed fill triangles and corner list are temporaries released when the call returns; only a small record is returned.
