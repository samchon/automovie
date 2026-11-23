# src/human/generation/IAutoMovieHumanEyelidSurface.ts#IAutoMovieHumanEyelidSurface.LoopEmit

## @evidence contracts/development/common.md#meaningful-documentation

Lid band from an eye's trim loop on its base chain: one column per lid sample, starting at the loop vertex the sample's outline point projects to, its skin depth and slope taken from the base surface's own derivative across the loop rather than from a cut triangle, so neighbouring columns start from one smooth surface.

## @evidence contracts/development/design.md#principled-representation

Lid band from an eye's trim loop on its base chain: one column per lid sample, starting at the loop vertex the sample's outline point projects to, its skin depth and slope taken from the base surface's own derivative across the loop rather than from a cut triangle, so neighbouring columns start from one smooth surface. The callable takes name, corners and returns void.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEyelidSurface.LoopEmit is the canonical exchange used by AutoMovieHumanEyelidSurface.loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanEyelidSurface.loop for lid band from an eye's trim loop on its base chain: one column per lid sample, starting at the loop vertex the sample's outline point projects to, its skin depth and slope taken from the base surface's own derivative across the loop rather than from a cut triangle, so neighbouring columns start from one smooth surface.
