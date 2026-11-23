# src/architecture/IAutoMoviePanelValue.ts#IAutoMoviePanelValue

## @evidence contracts/development/design.md#principled-representation

The engine turns the value into an element-local delta: a translation of `value` metres along the normalized axis, or a right-handed rotation of `value` radians about the normalized axis through the pivot, composed after the element's rest transform.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One scalar per panel is enough because each panel has exactly one degree of freedom, whose kind decides the unit, so the value needs no vector or unit field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An out-of-range or non-finite value is refused by validation rather than clamped into the panel's travel, and a value naming an unknown panel is refused rather than skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States that the value is relative to the rest pose, its unit per motion kind, its range, and which panel ids it may name.
