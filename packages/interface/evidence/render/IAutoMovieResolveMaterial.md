# src/render/IAutoMovieResolveMaterial.ts#IAutoMovieResolveMaterial

## @evidence contracts/development/common.md#meaningful-documentation

Cross-model material identity lookup for simulated surfaces and render inventories. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

The lookup combines borrowed model records and one exact material id, with no encoded-media payload.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Simulated material libraries and render inventory share the same global material resolver input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Conflicts and absence are refusals, while successful output still aliases its source material.

# src/render/IAutoMovieResolveMaterial.ts#IAutoMovieResolveMaterial.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines lookup scope, exact id matching, refusal, structural comparison and borrowed output.

## @evidence contracts/development/design.md#principled-representation

A string is a material id within the compiled model population, not image bytes or a model id; runtime rejects blank, absent and conflicting ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Simulated-surface material libraries and render inventory use this global lookup while ordinary parts retain model-local binding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fallback material masks missing identity and no winning candidate conceals conflicting definitions; existing model/material contracts own the records.
