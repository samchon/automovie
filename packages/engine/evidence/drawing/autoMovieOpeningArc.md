# src/drawing/autoMovieOpeningArc.ts#autoMovieOpeningArc

## @evidence contracts/development/implementation.md#principled-implementation

Recovers the circle from the chord and the bulge by the closed-form relations `offset = chord (1 - b^2) / (4 b)` and `sweep = -4 atan(b)`, which follow from the bulge being the tangent of a quarter of the sweep; the premise that a sweep is at most a half turn holds because validation bounds the bulge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of the bulge-to-arc conversion, shared by the drafted outline and the exact area so the two cannot disagree about which way an arch curves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No opening or bulge value is special-cased; a vanishing bulge or chord is straight because the circle degenerates there, not to dodge a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the bulge definition and sign convention, where the centre and sweep fall, when an edge counts as straight, the units and the validated range.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time: a few square roots and trigonometric calls, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time pure function called once per edge by each consumer; caching would cost more than the arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The arc record lives only for the edge being drafted or measured and is dropped by its caller in the same loop iteration.
