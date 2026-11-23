# src/pose/IAutoMoviePoseRig.ts#IAutoMoviePoseRig

## @evidence contracts/development/common.md#meaningful-documentation

States what the rig is for and each member's precedence and default.

## @evidence contracts/development/design.md#principled-representation

The skeleton with its two tables is exactly what fixes the map between clinical angles and bone-local rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each already an input of `resolvePose`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface skeleton and the engine's axis and rest-frame types.
