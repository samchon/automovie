# src/core/IAutoMovieRandom.ts#IAutoMovieRandom

## @evidence contracts/development/common.md#meaningful-documentation

Defines seed encoding, random-access indices, output ranges and child-stream identity.

## @evidence contracts/development/design.md#principled-representation

The seed is hexadecimal text; indices are dimensionless integers and block words are unsigned 32-bit numbers. Construction and draw admission enforce ranges that number/string cannot express.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the stream implemented by createAutoMovieRandom and consumed by seeded placement and procedural producers; block, integer and double access share one counter convention.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Child streams use stable text ids rather than population order; reproducibility does not imply collision-free hashing or cryptographic independence.
