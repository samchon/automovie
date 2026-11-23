# src/motion/IAutoMovieSeededChainFit.ts#IAutoMovieSeededChainFit

## @evidence contracts/development/design.md#principled-representation

The pose a fit returns and the two numbers that name its hinged candidate for any target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The answer, its seed and, for a fit with a strain, the value it was chosen by, which a caller ranking keys by their fits reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `IAutoMovieSwivelSeed`; null states there is no seed rather than inventing one.

## @evidence contracts/development/common.md#meaningful-documentation

States both members and when the seed is null.
