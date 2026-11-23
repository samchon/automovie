# src/soft/IAutoMoviePlantingFoliage.ts#IAutoMoviePlantingFoliage

## @evidence contracts/development/design.md#principled-representation

Bearing branch length and positive density determine leaf count above minLevel, with seeded scale and roll perturbations yielding unit-quaternion full-TRS occurrences.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The foliage law stays separate from branch recursion and material binding so one recipe can become bare without another growth implementation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Positive size and jitter below one target positive scales in representable arithmetic; very small products can underflow without a generated-scale gate. Output retains every local axis instead of substituting uniform scale or yaw-only orientation, while the viewer's planar XY leaf card has no thickness from local Z scale.

## @evidence contracts/development/common.md#meaningful-documentation

Defines leaves-per-meter density, minimum bearing level, local-meter prototype size and bounded seeded jitter.
