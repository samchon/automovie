# src/production/IAutoMovieInstanceChunk.ts#IAutoMovieInstanceChunk

## @evidence contracts/development/design.md#principled-representation

The compiled kernel aggregates slot positions into component-wise bounds and an arithmetic centroid for the half-open range; regenerating those slots uses the same instanceSlot law as rendering and inspection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Stores range metadata rather than every instance transform, leaving prototype and variation rules on the containing compiled set.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bounds describe positions, not guessed prototype size or only visible members; exact slot counts are retained even when seeded visibility hides an instance.

## @evidence contracts/development/common.md#meaningful-documentation

Defines stable chunk index, inclusive start and count, world-meter position bounds and arithmetic centroid.
