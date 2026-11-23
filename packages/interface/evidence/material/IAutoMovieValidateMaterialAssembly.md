# src/material/IAutoMovieValidateMaterialAssembly.ts#IAutoMovieValidateMaterialAssembly.IProps

## @evidence contracts/development/design.md#principled-representation

A layered assembly optionally joins its substance registry and geometric host; thickness comparisons use metres and the documented 1e-9 metre threshold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validateAutoMovieMaterialAssembly reuses the canonical assembly, substance and host records; omitted registry/host deliberately skip those comparisons.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not certify valid thickness, material identity or face exposure; the validator reports all detected violations rather than repairing a stack.

## @evidence contracts/development/common.md#meaningful-documentation

Documents independent optional checks, layer/finish/host admission and all-findings behavior.
