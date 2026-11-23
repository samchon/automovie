# src/material/autoMovieWearWeight.ts#autoMovieWearWeight

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the noise scale and why, the zero beyond the width and each parameter's unit.

## @evidence contracts/development/implementation.md#principled-implementation

The issue's smoothstep band times the procedural surfaces' four-octave noise; the noise lattice is one layer width so breakup patches match the band they interrupt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns a layer's weight; the shader writes the same expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant is fitted; the width scaling of the noise is the stated definition.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fractal evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
