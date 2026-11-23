# src/expression/AutoMovieExpressionPreset.ts#AutoMovieExpressionPreset

## @evidence contracts/development/design.md#principled-representation

The union is the VRM 1.0 preset list verbatim; `applyExpression` maps each non-neutral preset to an authored ARKit channel table scaled by the intensity clamped to `[0, 1]`, which is an approximation for meshes without VRM preset targets rather than a mapping either standard defines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closed union is the whole coarse vocabulary, typed into `IAutoMovieExpression.preset`; the per-preset channel table lives in the viewer that applies it, not in this type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No preset is given avatar-specific handling; like the ARKit channels, the engine's runtime `Set` and the viewer's preset list are type-checked only as subsets of this union, so review alone keeps them complete.

## @evidence contracts/development/common.md#meaningful-documentation

States how presets relate to ARKit channels, which presets serve lip-sync, mood and eyes, how the viewer applies a preset to both target kinds and what `neutral` drives, the validator's refusal, and the upstream reference.
