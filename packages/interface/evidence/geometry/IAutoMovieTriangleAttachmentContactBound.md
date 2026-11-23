# src/geometry/IAutoMovieTriangleAttachmentContactBound.ts#IAutoMovieTriangleAttachmentContactBound

## @evidence contracts/development/design.md#principled-representation

The cap is delta over delta plus s, the largest non-root barycentric weight any contact can carry, times the largest corner L1 distance from the root, with every operation rounded outward, so it encloses every contact point of the complete fan rather than a sampled nearest one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decision, the cap and the two slab quantities, so the separation query keeps only the cap while a test or diagnostic can see which quantity failed; the root and supports are not echoed because the caller passed them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unproved bound reports a zero cap instead of a guessed one, and the scaled projection unit is stated rather than presented as a Euclidean height, so no field claims more than the slab arithmetic proved.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, what proved guarantees, the meaning and true unit of the slab quantities, and the collapsed and nonpositive-gap results.
