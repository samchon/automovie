# src/scene/IAutoMovieLightBase.ts#IAutoMovieLightBase

## @evidence contracts/development/design.md#principled-representation

Kind-specific intensity units and transform state feed the viewer light adapter; validated position/rotation and emission pointer channels animate them while the scene's shadow master switch controls actual map work.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Common fields avoid duplicating identity and color across light kinds, with shadow tuning linked explicitly to castShadow rather than implicit host presets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Area shadow flags refuse, shadow controls are required exactly for casting punctual sources, and authored light flags do not override a disabled scene shadow policy.

## @evidence contracts/development/common.md#meaningful-documentation

Defines transform and channel ownership, linear color, lux/candela/nit units and requested versus actually rendered shadow state.
