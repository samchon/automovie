# src/soft/IAutoMoviePlantingCluster.ts#IAutoMoviePlantingCluster

## @evidence contracts/development/design.md#principled-representation

Bounded slot/attempt sampling generates candidates in a world-XZ rectangle; a minSpacing-sized grid checks neighboring accepted points before full TRS emission. Exhaustive-test equivalence requires representable cell indices and finite distance-square arithmetic, while zero spacing bypasses rejection; extreme numeric inputs are not universally certified.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One cluster defines recipe repetition and placement variability independently from recursive growth and architecture installation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Acceptance depends on earlier accepted slots in stable authored order; exhausted attempts produce counted refusal rather than overlap or an invented requested count.

## @evidence contracts/development/common.md#meaningful-documentation

Defines count, world anchor and half-extents, safe seed, spacing and attempt bounds, axis scale and normalized-quaternion yaw jitter.
