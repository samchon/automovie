# src/production/IAutoMovieProductionSoundPlan.ts#IAutoMovieProductionSoundPlan

## @evidence contracts/development/design.md#principled-representation

deriveProductionSoundPlan maps trimmed shot events, authored audio cues and caption dialogue onto the same rational film frame clock, retaining compile identity and explicit production acoustic profiles for a fixed 48 kHz stereo mix.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ordered events, cues, dialogue and optional room-tone beds separate semantic occurrence synthesis, adopted source playback, generated speech and the seeded noise floor; the plan contains references and normalized timing while callers own decoded buffers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing shot contracts, compiled source or camera refuse during planning; omitted propagation and acoustic profiles deliberately preserve the legacy dry path and supply no guessed room or physical policy.

## @evidence contracts/development/common.md#meaningful-documentation

Defines compile binding, exact frame-rate compatibility, total frame extent, fixed PCM format, optional profile absence, ordered sound populations and the optional room-tone beds.
