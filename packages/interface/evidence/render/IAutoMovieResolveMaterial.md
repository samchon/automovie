# src/render/IAutoMovieResolveMaterial.ts#IAutoMovieResolveMaterial.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines lookup scope, exact id matching, refusal, structural comparison and borrowed output.

## @evidence contracts/development/design.md#principled-representation

A string is a material id within the compiled model population, not image bytes or a model id; runtime rejects blank, absent and conflicting ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Simulated-surface material libraries and render inventory use this global lookup while ordinary parts retain model-local binding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fallback material masks missing identity and no winning candidate conceals conflicting definitions; existing model/material contracts own the records.
