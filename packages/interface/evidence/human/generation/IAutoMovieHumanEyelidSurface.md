# src/human/generation/IAutoMovieHumanEyelidSurface.ts#IAutoMovieHumanEyelidSurface

## @evidence contracts/development/common.md#meaningful-documentation

The named triangle sink supplied while emitting an eye's lid band. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only LoopEmit declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

LoopEmit separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanEyelidSurface exchanges the named LoopEmit contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanEyelidSurface.ts#IAutoMovieHumanEyelidSurface.LoopEmit

## @evidence contracts/development/common.md#meaningful-documentation

Lid band from an eye's trim loop on its base chain: one column per lid sample, starting at the loop vertex the sample's outline point projects to, its skin depth and slope taken from the base surface's own derivative across the loop rather than from a cut triangle, so neighbouring columns start from one smooth surface.

## @evidence contracts/development/design.md#principled-representation

Lid band from an eye's trim loop on its base chain: one column per lid sample, starting at the loop vertex the sample's outline point projects to, its skin depth and slope taken from the base surface's own derivative across the loop rather than from a cut triangle, so neighbouring columns start from one smooth surface. The callable takes name, corners and returns void.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEyelidSurface.LoopEmit is the canonical exchange used by AutoMovieHumanEyelidSurface.loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanEyelidSurface.loop for lid band from an eye's trim loop on its base chain: one column per lid sample, starting at the loop vertex the sample's outline point projects to, its skin depth and slope taken from the base surface's own derivative across the loop rather than from a cut triangle, so neighbouring columns start from one smooth surface.
