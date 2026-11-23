# src/authoring/IAutoMovieStageLight.ts#IAutoMovieStageLight

## @evidence contracts/development/design.md#principled-representation `validateLightPlacementShape` derives the family from `type`, defaulting to directional, then requires or forbids each field by family: an aim for every family but point, a position for every family but directional, `range` only on point and spot, `coneAngle` only on spot within `(0, 90]`, and `width` and `height` only on area. Area forbids castShadow presence; punctual castShadow true requires shadow tuning, while false permits no tuning. Colour components must lie in `[0, 1]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared identity, colour and intensity intersect a union discriminated by light type; every arm requires its physical inputs and marks inapplicable fields never, while the directional arm alone permits omission of type for the established sun-light default.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Defaults exist only where the family defines one, a `range` of `0`, a 45 degree cone and neutral white, and an area panel's extent has no default because an unstated window size is an undecided design, not a usual softbox.

## @evidence contracts/development/common.md#meaningful-documentation

States the per-family requirement of every optional field, the default each omission takes, intensity units per family, that `role` is never read, and why an area light takes neither `range` nor a shadow.
