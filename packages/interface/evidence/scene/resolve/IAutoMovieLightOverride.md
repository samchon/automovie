# src/scene/resolve/IAutoMovieLightOverride.ts#IAutoMovieLightOverride

## @evidence contracts/development/design.md#principled-representation

Accumulate only authored light-property samples; absent members preserve staged values and rotation/position remain separate from light-kind-specific scalar properties.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A sparse intermediate record separates channel sampling from the exhaustive light reconstruction in applyLightOverride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No zero or identity value is invented for absent animation; range/cone fields cannot create those fields on unsupported light kinds.

## @evidence contracts/development/common.md#meaningful-documentation

Members state intensity/color, metre range/position, degree cone angle and world orientation; direct reconstruction and untouched-shot identity are distinguished.
