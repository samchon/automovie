# src/production/effect/IAutoMovieMaterializeCompiledEffects.ts#IAutoMovieMaterializeCompiledEffects.IProps

## @evidence contracts/development/design.md#principled-representation

The exclusive contract/seedOwner union distinguishes shot-local and film-global seed identity; cue start/end and fixedStepSeconds use seconds on that owner's clock. Numeric admission remains with the shot or film validator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

materializeCompiledEffects consumes world recipe/zone tables and cues for both compile paths; only a shot id or production/film identity enters the respective seed protocol.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The never members prohibit mixing both seed owners. Missing recipe or zone references are skipped, while unsupported transport throws through admitEffectTransport; the caller must not interpret skipped cues as successful validation.

## @evidence contracts/development/common.md#meaningful-documentation

Owner selection and source data for deterministic effect-stream materialization. The exclusive contract/seedOwner union distinguishes shot-local and film-global seed identity; cue start/end and fixedStepSeconds use seconds on that owner's clock. Numeric admission remains with the shot or film validator.
